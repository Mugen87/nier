/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { MovingEntity } from './lib/yuka.module.js';

import world from './World.js';

class Projectile extends MovingEntity {

	constructor( owner = null ) {

		super();

		this.owner = owner;

	}

	update( delta ) {

		super.update( delta );

		// remove the projectile when it leaves the game area

		if ( this.position.x > world.field.x || this.position.x < - world.field.x ||
			this.position.z > world.field.z || this.position.z < - world.field.z ) {

			world.removeProjectile( this );
			return;

		}

	}

}

export { Projectile };
