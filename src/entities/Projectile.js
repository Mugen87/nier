/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { MovingEntity } from 'yuka';

class Projectile extends MovingEntity {

	constructor( owner = null ) {

		super();

		this.owner = owner;

	}

	update( delta ) {

		super.update( delta );

		// remove the projectile when it leaves the game area

		const world = this.owner.world;

		const fieldXHalfSize = world.field.x / 2;
		const fieldZHalfSize = world.field.z / 2;

		if ( this.position.x > fieldXHalfSize || this.position.x < - fieldXHalfSize ||
			this.position.z > fieldZHalfSize || this.position.z < - fieldZHalfSize ) {

			world.removeProjectile( this );
			return;

		}

	}

}

export { Projectile };
