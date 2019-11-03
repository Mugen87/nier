/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { AABB, MovingEntity, MathUtils, OBB, Ray, Vector3 } from 'yuka';

import { Particle, ParticleSystem } from '../core/ParticleSystem.js';
import { PlayerProjectile } from './PlayerProjectile.js';

const aabb = new AABB();
const direction = new Vector3();
const intersectionPoint = new Vector3();
const intersectionNormal = new Vector3();
const ray = new Ray();
const reflectionVector = new Vector3();
const offset = new Vector3();

class Player extends MovingEntity {

	constructor( world ) {

		super();

		this.world = world;

		this.maxSpeed = 6;
		this.updateOrientation = false;

		this.MAX_HEALTH_POINTS = 3;
		this.healthPoints = this.MAX_HEALTH_POINTS;

		this.boundingRadius = 0.5;

		this.shotsPerSecond = 10;
		this.lastShotTime = 0;

		this.obb = new OBB();
		this.obb.halfSizes.set( 0.1, 0.1, 0.5 );

		this.audios = new Map();

		// particles

		this.maxParticles = 20;
		this.particleSystem = new ParticleSystem();
		this.particleSystem.init( this.maxParticles );
		this.particlesPerSecond = 6; // number of particles per second with maxSpeed

		this._particlesNextEmissionTime = 0;
		this._particlesElapsedTime = 0;

	}

	shoot() {

		const world = this.world;
		const elapsedTime = world.time.getElapsed();

		if ( elapsedTime - this.lastShotTime > ( 1 / this.shotsPerSecond ) ) {

			this.lastShotTime = elapsedTime;

			this.getDirection( direction );

			const projectile = new PlayerProjectile( this, direction );

			world.addProjectile( projectile );

			const audio = this.audios.get( 'playerShot' );
			world.playAudio( audio );

		}

		return this;

	}

	heal() {

		this.healthPoints = this.MAX_HEALTH_POINTS;

		return this;

	}

	update( delta ) {

		this.obb.center.copy( this.position );
		this.obb.rotation.fromQuaternion( this.rotation );

		this._restrictMovement();

		super.update( delta );

		this.updateParticles( delta );

		return this;

	}

	updateParticles( delta ) {

		// check emission of new particles

		const timeScale = this.getSpeed() / this.maxSpeed; // [0,1]
		const effectiveDelta = delta * timeScale;

		this._particlesElapsedTime += effectiveDelta;

		if ( this._particlesElapsedTime > this._particlesNextEmissionTime ) {

			const t = 1 / this.particlesPerSecond;

			this._particlesNextEmissionTime = this._particlesElapsedTime + ( t / 2 ) + ( t / 2 * Math.random() );

			// emit new particle

			const particle = new Particle();
			offset.x = Math.random() * 0.3;
			offset.y = Math.random() * 0.3;
			offset.z = Math.random() * 0.3;
			particle.position.copy( this.position ).add( offset );
			particle.lifetime = Math.random() * 0.7 + 0.3;
			particle.opacity = Math.random() * 0.5 + 0.5;
			particle.size = Math.floor( Math.random() * 10 ) + 10;
			particle.angle = Math.round( Math.random() ) * Math.PI * Math.random();

			this.particleSystem.add( particle );

		}

		// update the system itself

		this.particleSystem.update( delta );

	}

	handleMessage( telegram ) {

		switch ( telegram.message ) {

			case 'hit':

				const world = this.world;

				const audio = this.audios.get( 'playerHit' );
				world.playAudio( audio );

				this.healthPoints --;

				if ( this.healthPoints === 0 ) {

					const audio = this.audios.get( 'playerExplode' );
					world.playAudio( audio );

				}

				break;

			default:

				console.error( 'Unknown message type:', telegram.message );

		}

		return true;

	}

	_restrictMovement() {

		if ( this.velocity.squaredLength() === 0 ) return;

		// check obstacles

		const world = this.world;
		const obstacles = world.obstacles;

		for ( let i = 0, l = obstacles.length; i < l; i ++ ) {

			const obstacle = obstacles[ i ];

			// enhance the AABB

			aabb.copy( obstacle.aabb );
			aabb.max.addScalar( this.boundingRadius * 0.5 );
			aabb.min.subScalar( this.boundingRadius * 0.5 );

			// setup ray

			ray.origin.copy( this.position );
			ray.direction.copy( this.velocity ).normalize();

			// perform ray/AABB intersection test

			if ( ray.intersectAABB( aabb, intersectionPoint ) !== null ) {

				const squaredDistance = this.position.squaredDistanceTo( intersectionPoint );

				if ( squaredDistance <= ( this.boundingRadius * this.boundingRadius ) ) {

					// derive normal vector

					aabb.getNormalFromSurfacePoint( intersectionPoint, intersectionNormal );

					// compute reflection vector

					reflectionVector.copy( ray.direction ).reflect( intersectionNormal );

					// compute new velocity vector

					const speed = this.getSpeed();

					this.velocity.addVectors( ray.direction, reflectionVector ).normalize();

					const f = 1 - Math.abs( intersectionNormal.dot( ray.direction ) );

					this.velocity.multiplyScalar( speed * f );

				}

			}

		}

		// ensure player does not leave the game area

		const fieldXHalfSize = world.field.x / 2;
		const fieldZHalfSize = world.field.z / 2;

		this.position.x = MathUtils.clamp( this.position.x, - ( fieldXHalfSize - this.boundingRadius ), ( fieldXHalfSize - this.boundingRadius ) );
		this.position.z = MathUtils.clamp( this.position.z, - ( fieldZHalfSize - this.boundingRadius ), ( fieldZHalfSize - this.boundingRadius ) );

		return this;

	}

}

export { Player };
