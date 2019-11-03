/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { OBB, Vector3 } from 'yuka';
import { Projectile } from './Projectile.js';

const target = new Vector3();

class PlayerProjectile extends Projectile {

	constructor( owner = null, direction ) {

		super( owner );

		this.boundingRadius = 0.5;
		this.obb = new OBB();

		this.maxSpeed = 20; // world units/seconds

		this.velocity.copy( direction ).multiplyScalar( this.maxSpeed );
		this.position.copy( this.owner.position );
		this.position.y = 0.5; // slightly raise the projectile

		target.copy( this.position ).add( this.velocity );
		this.lookAt( target ); // ensure GameEntity.rotation is up to date

		// set half sizes and orientation of OBB once (since projectiles will not change their shape and trajectory)

		this.obb.halfSizes.set( 0.1, 0.1, 0.5 );
		this.obb.rotation.fromQuaternion( this.rotation );

		this.isPlayerProjectile = true;

	}

	update( delta ) {

		super.update( delta );

		// update OBB

		this.obb.center.copy( this.position );

	}

}

export { PlayerProjectile };
