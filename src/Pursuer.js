/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { BoundingSphere, Vehicle, StateMachine } from './lib/yuka.module.js';

import world from './World.js';

class Pursuer extends Vehicle {

	constructor() {

		super();

		this.boundingRadius = 0.5;

		this.MAX_HEALTH_POINTS = 1;
		this.healthPoints = this.MAX_HEALTH_POINTS;

		this.boundingSphere = new BoundingSphere();
		this.boundingSphere.radius = this.boundingRadius;

		this.stateMachineMovement = new StateMachine( this );
		this.stateMachineCombat = new StateMachine( this );

		this.audios = new Map();

	}

	setCombatPattern( pattern ) {

		this.stateMachineCombat.currentState = pattern;
		this.stateMachineCombat.currentState.enter( this );

		return this;

	}

	setMovementPattern( pattern ) {

		this.stateMachineMovement.currentState = pattern;
		this.stateMachineMovement.currentState.enter( this );

		return this;

	}

	update( delta ) {

		this.boundingSphere.center.copy( this.position );

		this.stateMachineMovement.update();
		this.stateMachineCombat.update();

		super.update( delta );

		return this;

	}

	handleMessage( telegram ) {

		switch ( telegram.message ) {

			case 'hit':

				this.healthPoints --;

				if ( this.healthPoints === 0 ) {

					const audio = this.audios.get( 'pursuerExplode' );
					world.playAudio( audio );

					world.removePursuer( this );

					// clear states

					this.stateMachineCombat.currentState.exit( this );
					this.stateMachineMovement.currentState.exit( this );

				}

				break;

			default:

				console.error( 'Unknown message type:', telegram.message );

		}

		return true;

	}

}

export { Pursuer };
