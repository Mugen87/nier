/**
 * @author Mugen87 / https://github.com/Mugen87
 */

class AnimationSystem {

	constructor() {

		this.animations = [];

	}

	add( animation ) {

		this.animations.push( animation );

		return this;

	}

	remove( animation ) {

		const index = this.animations.indexOf( animation );
		this.animations.splice( index, 1 );

		return this;

	}

	update( delta ) {

		const animations = this.animations;

		for ( let i = ( animations.length - 1 ); i >= 0; i -- ) {

			const animation = animations[ i ];

			animation._elapsedTime += delta;

			// check for completion

			if ( animation._elapsedTime >= ( animation.duration + animation.delay ) ) {

				this.remove( animation );

			}

			// perform animation

			const t = Math.min( 1, ( Math.max( 0, animation._elapsedTime - animation.delay ) / animation.duration ) );

			if ( t > 0 ) {

				const object = animation.object;
				const property = animation.property;
				const targetValue = animation.targetValue;

				object[ property ] = targetValue * t; // linear animation

			}

		}

		return this;

	}

}

class PropertyAnimation {

	constructor() {

		this.object = null;
		this.property = null;
		this.targetValue = 0; // number
		this.duration = 0; // seconds
		this.delay = 0; // seconds

		this._elapsedTime = 0;

	}

}

export { AnimationSystem, PropertyAnimation };
