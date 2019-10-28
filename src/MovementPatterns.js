import { PursuitBehavior, State } from './lib/yuka.module.js';

import world from './World.js';

class MovementPattern extends State {

	constructor() {

		super();

		this.speed = 1.5;
		this.spread = 4;

	}

}

class LeftRightMovementPattern extends MovementPattern {

	execute( enemy ) {

		const elapsedTime = world.time.getElapsed();

		enemy.position.x = Math.cos( elapsedTime * this.speed ) * this.spread;

	}

}

class WavyMovementPattern extends MovementPattern {

	constructor() {

		super();

		this.offset = - 3;

	}

	execute( enemy ) {

		const t = world.time.getElapsed() * this.speed;

		enemy.position.x = Math.cos( t ) * this.spread;
		enemy.position.z = this.offset + ( Math.sin( t ) * Math.cos( t ) * this.spread );


	}

}

class CircleMovementPattern extends MovementPattern {

	constructor() {

		super();

		this.spread = 3;

	}

	execute( enemy ) {

		const t = world.time.getElapsed() * this.speed;

		enemy.position.x = Math.sin( t ) * this.spread;
		enemy.position.z = - Math.cos( t ) * this.spread;

	}

}

class PursuitBehaviorMovementPattern extends MovementPattern {

	enter( enemy ) {

		const pursuitBehavior = new PursuitBehavior( world.player, 2 );
		enemy.steering.add( pursuitBehavior );
		enemy.maxSpeed = 2;

	}

	exit( enemy ) {

		enemy.steering.clear();
		enemy.maxSpeed = 1;

	}

}

export { LeftRightMovementPattern, WavyMovementPattern, CircleMovementPattern, PursuitBehaviorMovementPattern };
