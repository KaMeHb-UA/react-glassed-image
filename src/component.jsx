import React, { Component } from 'react';

const basicStyles = {
	width: '100%',
	height: '100%',
	position: 'absolute',
};

function style(...additionalStyles) {
	return Object.assign({}, basicStyles, ...additionalStyles);
}

export class GlassedImage extends Component {
	state = {
		oldHref: '',
		nextHref: '',
		useSecondDiv: false,
	};

	updateHref = (oldHref, nextHref) => {
		this.setState({
			useSecondDiv: !this.state.useSecondDiv,
			oldHref,
			nextHref,
		});
	}

	componentDidMount() {
		this.updateHref(this.props.href, this.props.href);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.href !== this.props.href) {
			this.updateHref(prevProps.href, this.props.href);
		}
	}

	render() {
		const { useSecondDiv, oldHref, nextHref } = this.state;
		let { intensity, glassBaseColor, className, transition, position, size } = this.props;
		if (intensity === undefined) intensity = 5;
		if (glassBaseColor === undefined) glassBaseColor = '#888';
		if (transition === undefined) transition = '1s';
		if (position === undefined) position = 'center';
		if (size === undefined) size = 'cover';
		const sharedStyles = {
			transition,
			transitionProperty: 'opacity',
			backgroundPosition: position,
			backgroundSize: size,
		};
		return <div style={{ color: glassBaseColor, position: 'relative' }} className={className}>
			<div style={style(sharedStyles, {
				backgroundColor: '#000',
				backgroundImage: `url(${useSecondDiv ? oldHref : nextHref})`,
				opacity: +!useSecondDiv,
			})}/>
			<div style={style(sharedStyles, {
				backgroundImage: `url(${useSecondDiv ? nextHref : oldHref})`,
				opacity: +useSecondDiv,
			})}/>
			<div style={style({
				backgroundColor: 'currentColor',
				opacity: (intensity / 20).toFixed(2),
			})}/>
			<div style={style({
				backdropFilter: `blur(${intensity * 10}px)`,
			})}/>
		</div>
	}
}
