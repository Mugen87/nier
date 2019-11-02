/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import * as THREE from 'three';

class PursuerGeometry extends THREE.BufferGeometry {

	constructor() {

		super();

		const vertices = [];
		const indices = [];

		// top

		vertices.push( 1, 1, - 1 ); // 0
		vertices.push( - 1, 1, - 1 ); // 1
		vertices.push( 1, 1, 0 ); // 2
		vertices.push( - 1, 1, 0 ); // 3
		vertices.push( 0, 0, 1 ); // 4

		indices.push( 0, 1, 2 );
		indices.push( 2, 1, 3 );
		indices.push( 2, 3, 4 );

		// bottom

		vertices.push( 1, - 1, - 1 ); // 5
		vertices.push( - 1, - 1, - 1 ); // 6
		vertices.push( 1, - 1, 0 ); // 7
		vertices.push( - 1, - 1, 0 ); // 8
		vertices.push( 0, 0, 1 ); // 9

		indices.push( 6, 5, 7 );
		indices.push( 6, 7, 8 );
		indices.push( 8, 7, 9 );

		// left

		vertices.push( 1, 1, - 1 ); // 10
		vertices.push( 1, - 1, - 1 ); // 11
		vertices.push( 1, 1, 0 ); // 12
		vertices.push( 1, - 1, 0 ); // 13
		vertices.push( 0, 0, 1 ); // 14

		indices.push( 11, 10, 12 );
		indices.push( 12, 13, 11 );
		indices.push( 13, 12, 14 );

		// right

		vertices.push( - 1, - 1, - 1 ); // 15
		vertices.push( - 1, 1, - 1 ); // 16
		vertices.push( - 1, - 1, 0 ); // 17
		vertices.push( - 1, 1, 0 ); // 18
		vertices.push( 0, 0, 1 ); // 19

		indices.push( 16, 15, 17 );
		indices.push( 17, 18, 16 );
		indices.push( 18, 17, 19 );

		// back

		vertices.push( 1, 1, - 1 ); // 20
		vertices.push( 1, - 1, - 1 ); // 21
		vertices.push( - 1, - 1, - 1 ); // 22
		vertices.push( - 1, 1, - 1 ); // 23

		indices.push( 21, 22, 23 );
		indices.push( 23, 20, 21 );

		this.setIndex( indices );
		this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		this.computeVertexNormals();

		this.scale( 0.5, 0.5, 0.5 );

		this.computeBoundingSphere();

	}

}

export { PursuerGeometry };
