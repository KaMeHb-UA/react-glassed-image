import { build, analyzeMetafile } from 'esbuild';
import { exit, cwd, argv } from 'node:process';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile, readFile, readdir, mkdir } from 'node:fs/promises';

const dirname = resolve(fileURLToPath(import.meta.url), '..'),
	distDir = resolve(dirname, 'dist');

const minify = true;

/** @type {import('esbuild').BuildOptions} */
const buildConfig = {
	entryPoints: [
		resolve(dirname, 'src/index.js'),
	],
	bundle: true,
	outfile: resolve(distDir, 'index.js'),
	sourcemap: true,
	allowOverwrite: true,
	minify,
	minifyIdentifiers: minify,
	minifySyntax: minify,
	minifyWhitespace: minify,
	platform: 'browser',
	format: 'cjs',
	tsconfig: 'tsconfig.json',
	external: [
		'react',
	],
	metafile: true,
	plugins: [],
	legalComments: 'none',
};

const distPkgJson = {
	name: 'react-glassed-image',
	version: argv[2],
	type: 'commonjs',
	main: 'index.js',
	types: '@types/index.d.ts',
	peerDependencies: {
		react: '>=16',
	},
	peerDependenciesMeta: {
		react: {
			optional: true,
		},
	},
};

async function writePkgJson(target){
	const pkgJSON = Buffer.from(JSON.stringify(distPkgJson, null, '	'), 'utf8');
	await writeFile(target, pkgJSON);
	const from = '[[runtime]]';
	return {
		metafile: {
			inputs: {
				[from]: {
					bytes: 0,
					imports: [],
				},
			},
			outputs: {
				[relative(cwd(), target)]: {
					imports: [],
					exports: [],
					entryPoint: from,
					inputs: {
						[from]: {
							bytesInOutput: pkgJSON.length,
						},
					},
					bytes: pkgJSON.length,
				},
			},
		},
	};
}

async function copyWithSize(src, dest) {
	const r = await readFile(src);
	const { length } = r;
	await writeFile(dest, r);
	return length;
}

async function copyDir(src, dest) {
    const entries = await readdir(src, { withFileTypes: true });
    await mkdir(dest, { recursive: true });
	const results = [];
    for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            const size = await copyWithSize(srcPath, destPath);
			results.push([srcPath, destPath, size]);
        }
    }
	return results;
}

async function writeTypings(src, dest) {
	const results = await copyDir(src, dest);
	const metafile = { inputs: {}, outputs: {} };
	for (const [src, dest, bytes] of results) {
		const from = relative(cwd(), src);
		metafile.inputs[from] = {
			bytes: 0,
			imports: [],
		};
		metafile.outputs[relative(cwd(), dest)] = {
			imports: [],
			exports: [],
			entryPoint: from,
			inputs: {
				[from]: {
					bytesInOutput: bytes,
				},
			},
			bytes,
		};
	}
	return { metafile };
}

try {
	const result = await build(buildConfig);
	const distPkgJsonResult = await writePkgJson(resolve(distDir, 'package.json'));
	const distTypingsResult = await writeTypings(resolve(distDir, '..', '@types'), resolve(distDir, '@types'));
	const metafile = JSON.parse(JSON.stringify(result.metafile));
	Object.assign(metafile.inputs, distPkgJsonResult.metafile.inputs, distTypingsResult.metafile.inputs);
	Object.assign(metafile.outputs, distPkgJsonResult.metafile.outputs, distTypingsResult.metafile.outputs);
	console.log(await analyzeMetafile(metafile));
} catch(e) {
	exit(1);
}
