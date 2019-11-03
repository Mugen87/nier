/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { BoundingSphere, Vehicle, StateMachine, Quaternion } from 'yuka';

const q = new Quaternion();

class Guard extends Vehicle {

	constructor( world ) {

		super();

		this.world = world;

		this.boundingRadius = 0.5;

		this.MAX_HEALTH_POINTS = 8;
		this.healthPoints = this.MAX_HEALTH_POINTS;

		this.boundingSphere = new BoundingSphere();
		this.boundingSphere.radius = this.boundingRadius;

		this.stateMachineMovement = new StateMachine( this );
		this.stateMachineCombat = new StateMachine( this );

		this.audios = new Map();

		this.protectionMesh = null;
		this.protected = false;

		this.hitMesh = null;
		this.hitted = false;

		this.hitEffectDuration = 0.25;
		this.hitEffectMinDuration = 0.15;
		this._hideHitEffectTime = - Infinity;

	}

	enableProtection() {

		this.protected = true;
		this.protectionMesh.visible = true;

		return this;

	}

	disableProtection() {

		this.protected = false;
		this.protectionMesh.visible = false;

		const audio = this.audios.get( 'coreShieldDestroyed' );
		this.world.playAudio( audio );

		return this;

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

		const world = this.world;

		this.boundingSphere.center.copy( this.position );

		this.stateMachineMovement.update();
		this.stateMachineCombat.update();

		super.update( delta );

		// rendering related stuff

		if ( this.protected === true ) {

			this.protectionMesh.material.uniforms.time.value = world.time.getElapsed();

		}

		if ( this.hitted === true ) {

			q.copy( this.rotation ).inverse(); // undo rotation of parent
			this.hitMesh.quaternion.copy( q ).multiply( world.camera.quaternion );

			this.hitMesh.updateMatrix();

			this.hitMesh.material.uniforms.time.value += delta;

			if ( world.time.getElapsed() > this._hideHitEffectTime ) {

				this.hitMesh.visible = false;
				this.hitted = false;

			}

		}

		return this;

	}

	handleMessage( telegram ) {

		const world = this.world;

		switch ( telegram.message ) {

			case 'hit':

				if ( this.protected === false ) {

					this.healthPoints --;

					if ( this.hitted === true ) {

						if ( this.hitMesh.material.uniforms.time.value > this.hitEffectMinDuration ) {

							this.hitMesh.material.uniforms.time.value = 0;
							this._hideHitEffectTime = world.time.getElapsed() + this.hitEffectDuration;

						}

					} else {

						this.hitted = true;

						this.hitMesh.material.uniforms.time.value = 0;
						this.hitMesh.visible = true;

						this._hideHitEffectTime = world.time.getElapsed() + this.hitEffectDuration;

					}

					const audio = this.audios.get( 'enemyHit' );
					world.playAudio( audio );

					if ( this.healthPoints === 0 ) {

						const audio = this.audios.get( 'coreExplode' );
						world.playAudio( audio );

						world.removeGuard( this );

						// clear states

						this.stateMachineCombat.currentState.exit( this );
						this.stateMachineMovement.currentState.exit( this );

					}

				} else {

					const audio = this.audios.get( 'coreShieldHit' );
					world.playAudio( audio );

				}

				break;

			default:

				console.error( 'Unknown message type:', telegram.message );

		}

		return true;

	}

}

export { Guard };
