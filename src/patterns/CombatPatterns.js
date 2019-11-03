/**
 * @author Mugen87 / https://github.com/Mugen87
 */


import { State, Vector3 } from 'yuka';
import { EnemyProjectile } from '../entities/EnemyProjectile.js';

const direction = new Vector3();
const target = new Vector3();

class CombatPattern extends State {

	constructor() {

		super();

		this.shotsPerSecond = 0.5;
		this.projectilesPerShot = 3;
		this.destructibleProjectiles = 0; // amount of destructible projectiles per shot [0,1]

		this._lastShotTime = 0;

	}

	enter( enemy ) {

		this._lastShotTime = enemy.world.time.getElapsed();

	}

}

class DefaultCombatPattern extends CombatPattern {

	constructor() {

		super();

		this.angularStep = Math.PI * 0.167; // 30 degrees;

	}

	execute( enemy ) {

		const world = enemy.world;
		const elapsedTime = world.time.getElapsed();

		const halfAngle = this.angularStep * ( this.projectilesPerShot - 1 ) / 2;

		if ( elapsedTime - this._lastShotTime > ( 1 / this.shotsPerSecond ) ) {

			this._lastShotTime = elapsedTime;

			for ( let i = 0; i < this.projectilesPerShot; i ++ ) {

				const s = halfAngle - this.angularStep * i;

				target.copy( enemy.position );
				target.x += Math.sin( s );
				target.z += Math.cos( s );

				direction.subVectors( target, enemy.position ).normalize();
				direction.applyRotation( enemy.rotation );

				const projectile = new EnemyProjectile( enemy, direction );

				if ( Math.random() <= this.destructibleProjectiles ) projectile.isDestructible = true;

				world.addProjectile( projectile );

			}

			const audio = enemy.audios.get( 'enemyShot' );
			world.playAudio( audio );

		}

	}

}

class SpreadCombatPattern extends CombatPattern {

	constructor() {

		super();

		this.shotsPerSecond = 1;
		this.projectilesPerShot = 6;
		this.enableRotation = true;
		this.rotationSpeed = 1;

	}

	execute( enemy ) {

		const world = enemy.world;
		const elapsedTime = world.time.getElapsed();

		if ( elapsedTime - this._lastShotTime > ( 1 / this.shotsPerSecond ) ) {

			this._lastShotTime = elapsedTime;

			for ( let i = 0; i < this.projectilesPerShot; i ++ ) {

				let s = ( 2 * Math.PI * ( i / this.projectilesPerShot ) );

				if ( this.enableRotation ) s += elapsedTime * this.rotationSpeed;

				target.copy( enemy.position );
				target.x += Math.sin( s );
				target.z += Math.cos( s );

				direction.subVectors( target, enemy.position ).normalize();
				direction.applyRotation( enemy.rotation );

				const projectile = new EnemyProjectile( enemy, direction );

				if ( Math.random() <= this.destructibleProjectiles ) projectile.isDestructible = true;

				world.addProjectile( projectile );

			}

			const audio = enemy.audios.get( 'enemyShot' );
			world.playAudio( audio );

		}

	}

}

class FocusCombatPattern extends CombatPattern {

	constructor() {

		super();

		this.shotsPerSecond = 10;

		this.shotDuration = 1; // seconds
		this.pauseDuration = 0.5; // seconds

		this.shooting = true;

		this._nextPauseTime = Infinity;
		this._nextShotTime = - Infinity;

	}

	execute( enemy ) {

		const world = enemy.world;
		const elapsedTime = world.time.getElapsed();

		if ( elapsedTime > this._nextPauseTime ) {

			this.shooting = false;
			this._nextPauseTime = Infinity;
			this._nextShotTime = elapsedTime + this.pauseDuration;

		}

		if ( elapsedTime > this._nextShotTime ) {

			this.shooting = true;
			this._nextShotTime = Infinity;
			this._nextPauseTime = elapsedTime + this.shotDuration;

		}

		if ( this.shooting === true && ( elapsedTime - this._lastShotTime > ( 1 / this.shotsPerSecond ) ) ) {

			this._lastShotTime = elapsedTime;

			enemy.getDirection( direction );

			const projectile = new EnemyProjectile( enemy, direction );

			if ( Math.random() <= this.destructibleProjectiles ) projectile.isDestructible = true;

			world.addProjectile( projectile );

			const audio = enemy.audios.get( 'enemyShot' );
			world.playAudio( audio );

		}

	}

}

export { DefaultCombatPattern, SpreadCombatPattern, FocusCombatPattern };
