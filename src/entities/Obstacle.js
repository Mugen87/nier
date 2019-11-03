/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { AABB, GameEntity, OBB, Vector3 } from 'yuka';

class Obstacle extends GameEntity {

	constructor() {

		super();

		this.boundingRadius = 0.75;

		this.aabb = new AABB();
		this.obb = new OBB();

		this.needsUpdate = true; // controls update of render component since obstacles are mostly static

		this.size = new Vector3( 1, 1, 1 );

	}

	updateBoundingVolumes() {

		this.aabb.fromCenterAndSize( this.position, this.size );

		this.obb.center.copy( this.position );
		this.obb.halfSizes.copy( this.size ).multiplyScalar( 0.5 );

	}

}

export { Obstacle };
