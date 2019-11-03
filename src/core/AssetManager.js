/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import * as THREE from 'three';

class AssetManager {

	constructor() {

		this.loadingManager = new THREE.LoadingManager();

		this.audioLoader = new THREE.AudioLoader( this.loadingManager );

		this.listener = new THREE.AudioListener();

		this.audios = new Map();

	}

	init() {

		this._loadAudios();

		const loadingManager = this.loadingManager;

		return new Promise( ( resolve ) => {

			loadingManager.onLoad = () => {

				setTimeout( () => {

					resolve();

				}, 100 );

			};

		} );

	}

	cloneAudio( id ) {

		const source = this.audios.get( id );

		const audio = new source.constructor( source.listener );
		audio.buffer = source.buffer;
		audio.setRefDistance( source.getRefDistance() );
		audio.setVolume( source.getVolume() );

		return audio;

	}

	_loadAudios() {

		const audioLoader = this.audioLoader;
		const audios = this.audios;
		const listener = this.listener;

		const refDistance = 20;

		const playerShot = new THREE.PositionalAudio( listener );
		playerShot.setRefDistance( refDistance );
		const playerHit = new THREE.PositionalAudio( listener );
		playerHit.setRefDistance( refDistance );
		const playerExplode = new THREE.PositionalAudio( listener );
		playerExplode.setRefDistance( refDistance );
		const enemyShot = new THREE.PositionalAudio( listener );
		enemyShot.setRefDistance( refDistance );
		enemyShot.setVolume( 0.3 );
		const enemyHit = new THREE.PositionalAudio( listener );
		enemyHit.setRefDistance( refDistance );
		const coreExplode = new THREE.PositionalAudio( listener );
		coreExplode.setRefDistance( refDistance );
		const coreShieldHit = new THREE.PositionalAudio( listener );
		coreShieldHit.setRefDistance( refDistance );
		const coreShieldDestroyed = new THREE.PositionalAudio( listener );
		coreShieldDestroyed.setRefDistance( refDistance );
		const enemyExplode = new THREE.PositionalAudio( listener );
		enemyExplode.setRefDistance( refDistance );

		const buttonClick = new THREE.Audio( listener );
		buttonClick.setVolume( 0.5 );

		audioLoader.load( './audio/playerShot.ogg', buffer => playerShot.setBuffer( buffer ) );
		audioLoader.load( './audio/playerHit.ogg', buffer => playerHit.setBuffer( buffer ) );
		audioLoader.load( './audio/playerExplode.ogg', buffer => playerExplode.setBuffer( buffer ) );
		audioLoader.load( './audio/enemyShot.ogg', buffer => enemyShot.setBuffer( buffer ) );
		audioLoader.load( './audio/enemyHit.ogg', buffer => enemyHit.setBuffer( buffer ) );
		audioLoader.load( './audio/coreExplode.ogg', buffer => coreExplode.setBuffer( buffer ) );
		audioLoader.load( './audio/coreShieldHit.ogg', buffer => coreShieldHit.setBuffer( buffer ) );
		audioLoader.load( './audio/coreShieldDestroyed.ogg', buffer => coreShieldDestroyed.setBuffer( buffer ) );
		audioLoader.load( './audio/enemyExplode.ogg', buffer => enemyExplode.setBuffer( buffer ) );
		audioLoader.load( './audio/buttonClick.ogg', buffer => buttonClick.setBuffer( buffer ) );

		audios.set( 'playerShot', playerShot );
		audios.set( 'playerHit', playerHit );
		audios.set( 'playerExplode', playerExplode );
		audios.set( 'enemyShot', enemyShot );
		audios.set( 'enemyHit', enemyHit );
		audios.set( 'coreExplode', coreExplode );
		audios.set( 'coreShieldHit', coreShieldHit );
		audios.set( 'coreShieldDestroyed', coreShieldDestroyed );
		audios.set( 'enemyExplode', enemyExplode );
		audios.set( 'buttonClick', buttonClick );

	}

}

export { AssetManager };
