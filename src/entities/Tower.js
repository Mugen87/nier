/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { BoundingSphere, GameEntity, StateMachine } from 'yuka';

class Tower extends GameEntity {

	constructor( world ) {

		super();

		this.world = world;

		this.boundingRadius = 0.5;

		this.MAX_HEALTH_POINTS = 8;
		this.healthPoints = this.MAX_HEALTH_POINTS;

		this.boundingSphere = new BoundingSphere();
		this.boundingSphere.radius = this.boundingRadius;

		this.stateMachineCombat = new StateMachine( this );

		this.audios = new Map();

	}

	setCombatPattern( pattern ) {

		this.stateMachineCombat.currentState = pattern;
		this.stateMachineCombat.currentState.enter( this );

		return this;

	}

	updateBoundingVolumes() {

		this.boundingSphere.center.copy( this.position );

	}

	update() {

		this.stateMachineCombat.update();

		return this;

	}

	handleMessage( telegram ) {

		switch ( telegram.message ) {

			case 'hit':

				const world = this.world;

				this.healthPoints --;

				const audio = this.audios.get( 'enemyHit' );
				world.playAudio( audio );

				if ( this.healthPoints === 0 ) {

					const audio = this.audios.get( 'enemyExplode' );
					world.playAudio( audio );

					world.removeTower( this );

					// clear states

					this.stateMachineCombat.currentState.exit( this );

				}

				break;

			default:

				console.error( 'Unknown message type:', telegram.message );

		}

		return true;

	}

}

export { Tower };
