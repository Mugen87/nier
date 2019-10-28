/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Vector3 } from '../lib/yuka.module.js';
import * as THREE from '../lib/three.module.js';

import { ParticleShader } from '../etc/Shaders.js';

class ParticleSystem {

	constructor() {

		this.particles = [];
		this.maxParticles = 0;

		this._needsUpdate = false;

		// for rendering

		this._points = null;

	}

	add( particle ) {

		this.particles.push( particle );

		this._needsUpdate = true;

		return this;

	}

	remove( particle ) {

		const index = this.particles.indexOf( particle );
		this.particles.splice( index, 1 );

		this._needsUpdate = true;

		return this;

	}

	clear() {

		this.particles.length = 0;

	}

	init( maxParticles ) {

		this.maxParticles = maxParticles;

		const loader = new THREE.TextureLoader();
		const map = loader.load( './texture/quad.png' );

		const material = new THREE.ShaderMaterial( ParticleShader );
		material.uniforms.map.value = map;
		material.transparent = true;
		material.depthWrite = false;

		const geometry = new THREE.BufferGeometry();

		const positionAttribute = new THREE.BufferAttribute( new Float32Array( 3 * maxParticles ), 3 );
		positionAttribute.setUsage( THREE.DynamicDrawUsage );
		geometry.setAttribute( 'position', positionAttribute );

		const opacityAttribute = new THREE.BufferAttribute( new Float32Array( maxParticles ), 1 );
		opacityAttribute.setUsage( THREE.DynamicDrawUsage );
		geometry.setAttribute( 'opacity', opacityAttribute );

		const sizeAttribute = new THREE.BufferAttribute( new Uint8Array( maxParticles ), 1 );
		sizeAttribute.setUsage( THREE.DynamicDrawUsage );
		geometry.setAttribute( 'size', sizeAttribute );

		const angleAttribute = new THREE.BufferAttribute( new Float32Array( maxParticles ), 1 );
		angleAttribute.setUsage( THREE.DynamicDrawUsage );
		geometry.setAttribute( 'angle', angleAttribute );

		const tAttribute = new THREE.BufferAttribute( new Float32Array( maxParticles ), 1 );
		tAttribute.setUsage( THREE.DynamicDrawUsage );
		geometry.setAttribute( 't', tAttribute );

		this._points = new THREE.Points( geometry, material );

		return this;

	}

	update( delta ) {

		const particles = this.particles;
		const geometry = this._points.geometry;

		// update particles array

		for ( let i = ( particles.length - 1 ); i >= 0; i -- ) {

			const particle = particles[ i ];
			particle._elapsedTime += delta;

			if ( particle._elapsedTime >= particle.lifetime ) {

				this.remove( particle );

			}

		}

		// update buffer data for rendering

		// rebuild position and opacity buffer if necessary

		if ( this._needsUpdate === true ) {

			const positionAttribute = geometry.getAttribute( 'position' );
			const opacityAttribute = geometry.getAttribute( 'opacity' );
			const sizeAttribute = geometry.getAttribute( 'size' );
			const angleAttribute = geometry.getAttribute( 'angle' );

			for ( let i = 0, l = particles.length; i < l; i ++ ) {

				const particle = particles[ i ];

				const position = particle.position;
				const opacity = particle.opacity;
				const size = particle.size;
				const angle = particle.angle;

				positionAttribute.setXYZ( i, position.x, position.y, position.z );
				opacityAttribute.setX( i, opacity );
				sizeAttribute.setX( i, size );
				angleAttribute.setX( i, angle );

			}

			positionAttribute.needsUpdate = true;
			opacityAttribute.needsUpdate = true;
			sizeAttribute.needsUpdate = true;
			angleAttribute.needsUpdate = true;

		}

		// always rebuild "t" attribute which is used for animation

		const tAttribute = geometry.getAttribute( 't' );

		for ( let i = 0, l = particles.length; i < l; i ++ ) {

			const particle = particles[ i ];

			tAttribute.setX( i, particle._elapsedTime / particle.lifetime );

		}

		tAttribute.needsUpdate = true;

		// update draw range

		geometry.setDrawRange( 0, particles.length );

		return this;

	}

}

class Particle {

	constructor( position = new Vector3(), lifetime = 1, opacity = 1, size = 10, angle = 0 ) {

		this.position = position;
		this.lifetime = lifetime;
		this.opacity = opacity;
		this.size = size;
		this.angle = angle;

		this._elapsedTime = 0;

	}

}

export { ParticleSystem, Particle };
