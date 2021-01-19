/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { BoundingSphere, Vector3 } from 'yuka';
import { Projectile } from './Projectile.js';

const target = new Vector3();

class EnemyProjectile extends Projectile {

	constructor( owner = null, direction ) {

		super( owner );

		this.expiryTime = owner.world.time.getElapsed() + 5;

		this.boundingRadius = 0.4;
		this.boundingSphere = new BoundingSphere();
		this.boundingSphere.radius = this.boundingRadius;

		this.maxSpeed = 10; // world units/seconds

		this.velocity.copy( direction ).multiplyScalar( this.maxSpeed );
		this.position.copy( this.owner.position );
		this.position.y = 0.4; // slightly raise the projectile

		target.copy( this.position ).add( this.velocity );
		this.lookAt( target ); // ensure GameEntity.rotation is up to date

		this.isEnemyProjectile = true;
		this.isDestructible = false;

	}

	update( delta ) {

		super.update( delta );

		// update bounding sphere

		this.boundingSphere.center.copy( this.position );

	}

}

export { EnemyProjectile };
