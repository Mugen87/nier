/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import * as YUKA from '../lib/yuka.module.js';
import * as THREE from '../lib/three.module.js';

import { AssetManager } from './AssetManager.js';
import { VehicleControls } from './VehicleControls.js';

import { Player } from '../entities/Player.js';
import { Guard } from '../entities/Guard.js';
import { Pursuer } from '../entities/Pursuer.js';
import { LeftRightMovementPattern, WavyMovementPattern, CircleMovementPattern, PursuitBehaviorMovementPattern } from '../patterns/MovementPatterns.js';
import { DefaultCombatPattern, SpreadCombatPattern, FocusCombatPattern } from '../patterns/CombatPatterns.js';
import { ProtectionShader, HitShader } from '../etc/Shaders.js';
import { PursuerGeometry } from '../etc/PursuerGeometry.js';

const toVector = new YUKA.Vector3();
const displacement = new YUKA.Vector3();

class World {

	constructor() {

		this.active = false;
		this.gameOver = false;

		this.entityManager = new YUKA.EntityManager();
		this.time = new YUKA.Time();

		this.field = new YUKA.Vector3( 7.5, 0, 7.5 );
		this.currentStage = 1;
		this.maxStage = 8;

		this.camera = null;
		this.scene = null;
		this.renderer = null;

		this.player = null;
		this.controls = null;

		this.playerMesh = null;
		this.playerProjectiles = [];
		this.playerProjectileMesh = null;
		this.maxPlayerProjectiles = 100;

		this.enemyProjectiles = [];
		this.enemyProjectileMesh = null;
		this.enemyDestructibleProjectiles = [];
		this.enemyDestructibleProjectileMesh = null;
		this.maxEnemyProjectiles = 200;
		this.maxEnemyDestructibleProjectiles = 200;

		this.obstacles = [];
		this.obstacleMesh = null;
		this.maxObstacles = 10;

		this.pursuers = [];
		this.pursuerMesh = null;

		this.guards = [];
		this.guardMesh = null;
		this.protectionMesh = null;
		this.hitMesh = null;
		this.guardsProtected = false;

		this.assetManager = null;

		this._requestID = null;

		this._startAnimation = startAnimation.bind( this );
		this._stopAnimation = stopAnimation.bind( this );
		this._onContinueButtonClick = onContinueButtonClick.bind( this );
		this._onWindowResize = onWindowResize.bind( this );
		this._onRestart = onRestart.bind( this );

		this.ui = {
			continueButton: document.getElementById( 'menu-continue' ),
			restartButtonMenu: document.getElementById( 'menu-restart' ),
			restartButtonComplete: document.getElementById( 'complete-restart' ),
			restartButtonGameOver: document.getElementById( 'gameover-restart' ),
			menu: document.getElementById( 'menu' ),
			hackingComplete: document.getElementById( 'hackingComplete' ),
			gameComplete: document.getElementById( 'gameComplete' ),
			gameOver: document.getElementById( 'gameOver' ),
		};

	}

	init() {

		this.assetManager = new AssetManager(); // creating the assset manager here to avoid a web audio context warning

		this.assetManager.init().then( () => {

			this._initScene();
			this._initBackground();
			this._initPlayer();
			this._initControls();

			this._loadStage( this.currentStage );

		} );

	}

	update() {

		const delta = this.time.update().getDelta();

		if ( this.active ) {

			// game logic

			this.controls.update( delta );
			this.entityManager.update( delta );

			this._enforceNonPenetrationConstraint();

			this._checkPlayerCollision();
			this._checkPlayerProjectileCollisions();
			this._checkEnemyProjectileCollisions();
			this._checkGameStatus();

			// rendering

			this._updateObstaclesMeshes();
			this._updateProjectileMeshes();

			this.renderer.render( this.scene, this.camera );

		}

	}

	addGuard( guard ) {

		this.guards.push( guard );
		this.entityManager.add( guard );

		this.scene.add( guard._renderComponent );

	}

	removeGuard( guard ) {

		const index = this.guards.indexOf( guard );
		this.guards.splice( index, 1 );

		this.entityManager.remove( guard );
		this.scene.remove( guard._renderComponent );

	}

	addPursuer( pursuer ) {

		this.pursuers.push( pursuer );
		this.entityManager.add( pursuer );

		this.scene.add( pursuer._renderComponent );

	}

	removePursuer( pursuer ) {

		const index = this.pursuers.indexOf( pursuer );
		this.pursuers.splice( index, 1 );

		this.entityManager.remove( pursuer );
		this.scene.remove( pursuer._renderComponent );

	}

	addProjectile( projectile ) {

		if ( projectile.isPlayerProjectile ) {

			this.playerProjectiles.push( projectile );

		} else {

			if ( projectile.isDestructible ) {

				this.enemyDestructibleProjectiles.push( projectile );


			} else {

				this.enemyProjectiles.push( projectile );

			}

		}

		this.entityManager.add( projectile );

	}

	removeProjectile( projectile ) {

		if ( projectile.isPlayerProjectile ) {

			const index = this.playerProjectiles.indexOf( projectile );
			this.playerProjectiles.splice( index, 1 );

		} else {

			if ( projectile.isDestructible ) {

				const index = this.enemyDestructibleProjectiles.indexOf( projectile );
				this.enemyDestructibleProjectiles.splice( index, 1 );

			} else {

				const index = this.enemyProjectiles.indexOf( projectile );
				this.enemyProjectiles.splice( index, 1 );

			}

		}

		this.entityManager.remove( projectile );

	}

	addObstacle( obstacle ) {

		this.obstacles.push( obstacle );
		this.entityManager.add( obstacle );

	}

	removeObstacle( obstacle ) {

		const index = this.obstacles.indexOf( obstacle );
		this.obstacles.splice( index, 1 );

		this.entityManager.remove( obstacle );

	}

	playAudio( audio ) {

		if ( audio.isPlaying === true ) audio.stop();
		audio.play();

	}

	_initScene() {

		// camera

		this.camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 200 );
		this.camera.add( this.assetManager.listener );

		// scene

		this.scene = new THREE.Scene();

		// lights

		const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
		ambientLight.matrixAutoUpdate = false;
		this.scene.add( ambientLight );

		const dirLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
		dirLight.position.set( 1, 10, - 1 );
		dirLight.matrixAutoUpdate = false;
		dirLight.updateMatrix();
		dirLight.castShadow = true;
		dirLight.shadow.camera.top = 15;
		dirLight.shadow.camera.bottom = - 15;
		dirLight.shadow.camera.left = - 15;
		dirLight.shadow.camera.right = 15;
		dirLight.shadow.camera.near = 1;
		dirLight.shadow.camera.far = 20;
		dirLight.shadow.mapSize.x = 2048;
		dirLight.shadow.mapSize.y = 2048;
		dirLight.shadow.bias = 0.01;
		this.scene.add( dirLight );

		// this.scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

		// ground

		const groundGeometry = new THREE.BoxBufferGeometry( 15, 1, 15 );
		const groundMaterial = new THREE.MeshLambertMaterial( { color: 0xaca181 } );

		const ground = new THREE.Mesh( groundGeometry, groundMaterial );
		ground.matrixAutoUpdate = false;
		ground.position.set( 0, - 0.5, 0 );
		ground.updateMatrix();
		ground.receiveShadow = true;
		this.scene.add( ground );

		// player

		const playerGeometry = new THREE.ConeBufferGeometry( 0.2, 1, 8 );
		playerGeometry.rotateX( Math.PI * 0.5 );
		const playerMaterial = new THREE.MeshLambertMaterial( { color: 0xdedad3 } );
		this.playerMesh = new THREE.Mesh( playerGeometry, playerMaterial );
		this.playerMesh.matrixAutoUpdate = false;
		this.playerMesh.castShadow = true;
		this.scene.add( this.playerMesh );

		// player projectile

		const playerProjectileGeometry = new THREE.PlaneBufferGeometry( 0.2, 1 );
		playerProjectileGeometry.rotateX( Math.PI * - 0.5 );
		const playerProjectileMaterial = new THREE.MeshBasicMaterial( { color: 0xfff9c2 } );

		this.playerProjectileMesh = new THREE.InstancedMesh( playerProjectileGeometry, playerProjectileMaterial, this.maxPlayerProjectiles );
		this.playerProjectileMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
		this.playerProjectileMesh.frustumCulled = false;
		this.scene.add( this.playerProjectileMesh );

		// enemy projectile

		const enemyProjectileGeometry = new THREE.SphereBufferGeometry( 0.4, 16, 16 );
		enemyProjectileGeometry.rotateX( Math.PI * - 0.5 );
		const enemyProjectileMaterial = new THREE.MeshLambertMaterial( { color: 0x43254d } );

		this.enemyProjectileMesh = new THREE.InstancedMesh( enemyProjectileGeometry, enemyProjectileMaterial, this.maxEnemyProjectiles );
		this.enemyProjectileMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
		this.enemyProjectileMesh.frustumCulled = false;
		this.scene.add( this.enemyProjectileMesh );

		// enemy destructible projectile

		const enemyDestructibleProjectileGeometry = new THREE.SphereBufferGeometry( 0.4, 16, 16 );
		enemyDestructibleProjectileGeometry.rotateX( Math.PI * - 0.5 );
		const enemyDestructibleProjectileMaterial = new THREE.MeshLambertMaterial( { color: 0xf34d08 } );

		this.enemyDestructibleProjectileMesh = new THREE.InstancedMesh( enemyDestructibleProjectileGeometry, enemyDestructibleProjectileMaterial, this.maxEnemyProjectiles );
		this.enemyDestructibleProjectileMesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage );
		this.enemyDestructibleProjectileMesh.frustumCulled = false;
		this.scene.add( this.enemyDestructibleProjectileMesh );

		// obstacle

		const obtacleGeometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
		const obtacleMaterial = new THREE.MeshLambertMaterial( { color: 0xdedad3 } );

		this.obstacleMesh = new THREE.InstancedMesh( obtacleGeometry, obtacleMaterial, this.maxObstacles );
		this.obstacleMesh.frustumCulled = false;
		this.obstacleMesh.castShadow = true;
		this.scene.add( this.obstacleMesh );

		// pursuer enemy

		const pursuerGeometry = new PursuerGeometry();
		const pursuerMaterial = new THREE.MeshLambertMaterial( { color: 0x333132 } );

		this.pursuerMesh = new THREE.Mesh( pursuerGeometry, pursuerMaterial );
		this.pursuerMesh.matrixAutoUpdate = false;
		this.pursuerMesh.castShadow = true;

		// guard enemy

		const guardGeometry = new THREE.SphereBufferGeometry( 0.5, 16, 16 );
		const guardMaterial = new THREE.MeshLambertMaterial( { color: 0x333132 } );
		this.guardMesh = new THREE.Mesh( guardGeometry, guardMaterial );
		this.guardMesh.matrixAutoUpdate = false;
		this.guardMesh.castShadow = true;

		const protectionGeometry = new THREE.SphereBufferGeometry( 0.75, 16, 16 );
		const protectionMaterial = new THREE.ShaderMaterial( ProtectionShader );
		protectionMaterial.transparent = true;
		this.protectionMesh = new THREE.Mesh( protectionGeometry, protectionMaterial );
		this.protectionMesh.matrixAutoUpdate = false;
		this.protectionMesh.visible = false;

		const hitGeometry = new THREE.PlaneBufferGeometry( 2.5, 2.5 );
		const hitMaterial = new THREE.ShaderMaterial( HitShader );
		hitMaterial.transparent = true;
		this.hitMesh = new THREE.Mesh( hitGeometry, hitMaterial );
		this.hitMesh.matrixAutoUpdate = false;
		this.hitMesh.visible = false;

		// renderer

		this.renderer = new THREE.WebGLRenderer( { antialias: true } );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.gammaOutput = true;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		document.body.appendChild( this.renderer.domElement );

		// listeners

		window.addEventListener( 'resize', this._onWindowResize, false );
		this.ui.continueButton.addEventListener( 'click', this._onContinueButtonClick, false );
		this.ui.restartButtonMenu.addEventListener( 'click', this._onRestart, false );
		this.ui.restartButtonComplete.addEventListener( 'click', this._onRestart, false );
		this.ui.restartButtonGameOver.addEventListener( 'click', this._onRestart, false );

	}

	_initBackground() {

		this.scene.background = new THREE.Color( 0x6d685d );

		const count = 25;

		const geometry = new THREE.BoxBufferGeometry( 0.5, 0.5, 0.5 );
		const material = new THREE.MeshBasicMaterial( { color: 0xaca181 } );

		const backgroundObjects = new THREE.InstancedMesh( geometry, material, count );

		const dummy = new THREE.Object3D();

		for ( let i = 0; i < count; i ++ ) {

			dummy.position.x = THREE.Math.randFloat( - 75, 75 );
			dummy.position.y = THREE.Math.randFloat( - 75, - 50 );
			dummy.position.z = THREE.Math.randFloat( - 75, 75 );

			dummy.scale.set( 1, 1, 1 ).multiplyScalar( Math.random() );

			dummy.updateMatrix();

			backgroundObjects.setMatrixAt( i, dummy.matrix );

		}

		this.scene.add( backgroundObjects );

	}

	_initPlayer() {

		this.player = new Player( this );
		this.player.setRenderComponent( this.playerMesh, sync );

		// particle system

		this.scene.add( this.player.particleSystem._points );

		// audio

		const playerShot = this.assetManager.audios.get( 'playerShot' );
		const playerHit = this.assetManager.audios.get( 'playerHit' );
		const playerExplode = this.assetManager.audios.get( 'playerExplode' );

		this.playerMesh.add( playerShot, playerHit, playerExplode );

		this.player.audios.set( 'playerShot', playerShot );
		this.player.audios.set( 'playerHit', playerHit );
		this.player.audios.set( 'playerExplode', playerExplode );

		//

		this.entityManager.add( this.player );

	}

	_initControls() {

		this.controls = new VehicleControls( this.player, this.camera );
		this.controls.setPosition( new YUKA.Vector3( 0, 0, 0 ) );

		this.controls.addEventListener( 'lock', ( ) => {

			this.ui.menu.classList.add( 'hidden' );

			this.time.currentTime = this.time.now();

			this._startAnimation();

		} );

		this.controls.addEventListener( 'unlock', () => {

			if ( this.gameOver === false ) {

				this.ui.menu.classList.remove( 'hidden' );

				this._stopAnimation();

			}

		} );

	}

	_loadStage01() {

		// controls

		this.controls.setPosition( 0, 0.5, 5 );
		this.controls.resetRotation();

		// enemies

		const guard = this._createGuard();
		guard.position.set( 0, 0.5, - 4 );
		guard.setCombatPattern( new DefaultCombatPattern() );
		guard.setMovementPattern( new LeftRightMovementPattern() );
		this.addGuard( guard );

	}

	_loadStage02() {

		// controls

		this.controls.setPosition( 0, 0.5, 5 );
		this.controls.resetRotation();

		// enemies

		const guard = this._createGuard();
		guard.position.set( 0, 0.5, 0 );
		const combatPattern = new DefaultCombatPattern();
		combatPattern.shotsPerSecond = 1;
		guard.setCombatPattern( combatPattern );
		guard.setMovementPattern( new WavyMovementPattern() );

		this.addGuard( guard );

	}

	_loadStage03() {

		// controls

		this.controls.setPosition( 0, 0.5, 5 );
		this.controls.resetRotation();

		// enemies

		const guard = this._createGuard();
		guard.position.set( 0, 0.5, 0 );
		guard.setCombatPattern( new SpreadCombatPattern() );
		guard.setMovementPattern( new CircleMovementPattern() );

		this.addGuard( guard );

	}

	_loadStage04() {

		// controls

		this.controls.setPosition( 0, 0.5, 5 );
		this.controls.resetRotation();

		// enemies

		const guard = this._createGuard();
		guard.position.set( 0, 0.5, - 4 );
		const combatPattern = new DefaultCombatPattern();
		combatPattern.shotsPerSecond = 2;
		combatPattern.destructibleProjectiles = 3;
		guard.setCombatPattern( combatPattern );
		guard.setMovementPattern( new LeftRightMovementPattern() );

		this.addGuard( guard );

	}

	_loadStage05() {

		// controls

		this.controls.setPosition( 0, 0.5, 5 );
		this.controls.resetRotation();

		// enemies

		const guard = this._createGuard();
		guard.position.set( 0, 0.5, - 4 );
		const combatPattern = new SpreadCombatPattern();
		combatPattern.shotsPerSecond = 2;
		combatPattern.enableRotation = false;
		guard.setCombatPattern( combatPattern );
		guard.setMovementPattern( new PursuitBehaviorMovementPattern() );

		this.addGuard( guard );

	}

	_loadStage06() {

		// controls

		this.controls.setPosition( 0, 0.5, 5 );
		this.controls.resetRotation();

		// enemies

		const guard = this._createGuard();
		guard.position.set( 0, 0.5, - 4 );
		const combatPattern = new FocusCombatPattern();
		combatPattern.destructibleProjectiles = 5;
		guard.setCombatPattern( combatPattern );
		guard.setMovementPattern( new PursuitBehaviorMovementPattern() );

		this.addGuard( guard );

	}

	_loadStage07() {

		this.guardsProtected = true;

		// controls

		this.controls.setPosition( 0, 0.5, 5 );
		this.controls.resetRotation();

		// enemies

		const guard = this._createGuard();
		guard.position.set( 0, 0.5, - 6 );
		guard.setCombatPattern( new DefaultCombatPattern() );
		guard.setMovementPattern( new PursuitBehaviorMovementPattern() );
		guard.enableProtection();

		this.addGuard( guard );

		// pursuer

		const pusuerCount = 7;

		for ( let i = 0; i < pusuerCount; i ++ ) {

			const pursuer = this._createPursuer();

			const s = Math.PI * ( i / pusuerCount );
			const x = Math.cos( s ) * 4;
			const z = - 4 + Math.sin( s ) * 4;

			pursuer.position.set( x, 0.5, z );

			const combatPattern = new DefaultCombatPattern();
			combatPattern.projectilesPerShot = 0;
			pursuer.setCombatPattern( combatPattern );
			pursuer.setMovementPattern( new PursuitBehaviorMovementPattern() );

			this.addPursuer( pursuer );

		}

	}

	_loadStage08() {

		this.guardsProtected = true;

		// controls

		this.controls.setPosition( 0, 0.5, 5 );
		this.controls.resetRotation();

		// enemies

		const guard = this._createGuard();
		guard.position.set( 0, 0.5, - 6 );
		const combatPattern = new FocusCombatPattern();
		combatPattern.pauseDuration = 1;
		guard.setCombatPattern( combatPattern );
		guard.setMovementPattern( new PursuitBehaviorMovementPattern() );
		guard.enableProtection();

		this.addGuard( guard );

		// pursuer

		const pusuerCount = 7;

		for ( let i = 0; i < pusuerCount; i ++ ) {

			const pursuer = this._createPursuer();

			const s = Math.PI * ( i / pusuerCount );
			const x = Math.cos( s ) * 4;
			const z = - 4 + Math.sin( s ) * 4;

			pursuer.position.set( x, 0.5, z );

			const combatPattern = new FocusCombatPattern();
			combatPattern.shotsPerSecond = 1;
			combatPattern.destructibleProjectiles = 1;
			pursuer.setCombatPattern( combatPattern );
			pursuer.setMovementPattern( new PursuitBehaviorMovementPattern() );

			this.addPursuer( pursuer );

		}


	}

	_createGuard() {

		const guard = new Guard( this );
		const guardMesh = this.guardMesh.clone();
		const protectionMesh = this.protectionMesh.clone();
		const hitMesh = this.hitMesh.clone();

		guardMesh.add( protectionMesh );
		guardMesh.add( hitMesh );
		//this.scene.add( hitMesh ); // adding the mesh to the scene so it's easier to determine its transformation
		guard.setRenderComponent( guardMesh, sync );
		guard.protectionMesh = protectionMesh;
		guard.hitMesh = hitMesh;

		const enemyShot = this.assetManager.cloneAudio( 'enemyShot' );
		const enemyHit = this.assetManager.cloneAudio( 'enemyHit' );
		const coreExplode = this.assetManager.cloneAudio( 'coreExplode' );
		const coreShieldHit = this.assetManager.cloneAudio( 'coreShieldHit' );
		const coreShieldDestroyed = this.assetManager.cloneAudio( 'coreShieldDestroyed' );

		guardMesh.add( enemyShot );
		guardMesh.add( enemyHit );
		guardMesh.add( coreExplode );
		guardMesh.add( coreShieldHit );
		guardMesh.add( coreShieldDestroyed );

		guard.audios.set( 'enemyShot', enemyShot );
		guard.audios.set( 'enemyHit', enemyHit );
		guard.audios.set( 'coreExplode', coreExplode );
		guard.audios.set( 'coreShieldHit', coreShieldHit );
		guard.audios.set( 'coreShieldDestroyed', coreShieldDestroyed );

		return guard;

	}

	_createPursuer() {

		const pursuer = new Pursuer( this );
		const pursuerMesh = this.pursuerMesh.clone();
		pursuer.setRenderComponent( pursuerMesh, sync );

		const enemyShot = this.assetManager.cloneAudio( 'enemyShot' );
		const pursuerExplode = this.assetManager.cloneAudio( 'pursuerExplode' );

		pursuer.audios.set( 'enemyShot', enemyShot );
		pursuer.audios.set( 'pursuerExplode', pursuerExplode );

		pursuerMesh.add( enemyShot );
		pursuerMesh.add( pursuerExplode );

		return pursuer;

	}

	_checkPlayerCollision() {

		const player = this.player;
		const guards = this.guards;
		const pursuers = this.pursuers;

		// perform intersection test with guards

		for ( let i = 0, l = guards.length; i < l; i ++ ) {

			const guard = guards[ i ];

			const squaredDistance = player.position.squaredDistanceTo( guard.position );
			const range = player.boundingRadius + guard.boundingRadius;

			if ( squaredDistance <= ( range * range ) ) {

				if ( player.obb.intersectsBoundingSphere( guard.boundingSphere ) === true ) {

					// dead

					player.healthPoints = 0;

					const audio = player.audios.get( 'playerExplode' );
					this.playAudio( audio );
					return;

				}

			}

		}

		// perform intersection test with pursuers

		for ( let i = 0, l = pursuers.length; i < l; i ++ ) {

			const pursuer = pursuers[ i ];

			const squaredDistance = player.position.squaredDistanceTo( pursuer.position );
			const range = player.boundingRadius + pursuer.boundingRadius;

			if ( squaredDistance <= ( range * range ) ) {

				if ( player.obb.intersectsBoundingSphere( pursuer.boundingSphere ) === true ) {

					// dead

					player.healthPoints = 0;

					const audio = player.audios.get( 'playerExplode' );
					this.playAudio( audio );
					return;

				}

			}

		}

	}

	_checkPlayerProjectileCollisions() {

		const playerProjectiles = this.playerProjectiles;

		// perform intersection test of player projectiles

		for ( let i = ( playerProjectiles.length - 1 ); i >= 0; i -- ) {

			this._checkPlayerProjectileCollision( playerProjectiles[ i ] );

		}

	}

	_checkEnemyProjectileCollisions() {

		const enemyProjectiles = this.enemyProjectiles;
		const enemyDestructibleProjectiles = this.enemyDestructibleProjectiles;

		// perform intersection test of enemy projectiles

		for ( let i = ( enemyProjectiles.length - 1 ); i >= 0; i -- ) {

			this._checkEnemyProjectileCollision( enemyProjectiles[ i ] );

		}

		for ( let i = ( enemyDestructibleProjectiles.length - 1 ); i >= 0; i -- ) {

			this._checkEnemyProjectileCollision( enemyDestructibleProjectiles[ i ] );

		}

	}

	_checkEnemyProjectileCollision( projectile ) {

		const obstacles = this.obstacles;
		const player = this.player;
		const playerProjectiles = this.playerProjectiles;

		for ( let i = 0, l = obstacles.length; i < l; i ++ ) {

			// first test (find out how close objects are)

			const obstacle = obstacles[ i ];

			const squaredDistance = projectile.position.squaredDistanceTo( obstacle.position );
			const range = projectile.boundingRadius + obstacle.boundingRadius;

			if ( squaredDistance <= ( range * range ) ) {

				// second more expensive test (only performed if objects are close enough)

				if ( obstacle.obb.intersectsBoundingSphere( projectile.boundingSphere ) === true ) {

					this.removeProjectile( projectile );
					return;

				}

			}

		}

		if ( projectile.isDestructible === true ) {

			// perform intersection test with player projectiles

			for ( let i = ( playerProjectiles.length - 1 ); i >= 0; i -- ) {

				// first test (find out how close objects are)

				const playerProjectile = playerProjectiles[ i ];

				const squaredDistance = projectile.position.squaredDistanceTo( playerProjectile.position );
				const range = projectile.boundingRadius + playerProjectile.boundingRadius;

				if ( squaredDistance <= ( range * range ) ) {

					// second more expensive test (only performed if objects are close enough)

					if ( playerProjectile.obb.intersectsBoundingSphere( projectile.boundingSphere ) === true ) {

						this.removeProjectile( projectile );
						this.removeProjectile( playerProjectile );
						return;

					}

				}

			}

		}

		// perform intersection test with player

		const squaredDistance = projectile.position.squaredDistanceTo( player.position );
		const range = projectile.boundingRadius + player.boundingRadius;

		if ( squaredDistance <= ( range * range ) ) {

			if ( player.obb.intersectsBoundingSphere( projectile.boundingSphere ) === true ) {

				projectile.sendMessage( player, 'hit' );
				this.removeProjectile( projectile );
				return;

			}

		}

	}

	_checkPlayerProjectileCollision( playerProjectile ) {

		const guards = this.guards;
		const pursuers = this.pursuers;
		const obstacles = this.obstacles;

		// enemies

		// guards

		for ( let i = 0, l = guards.length; i < l; i ++ ) {

			// first test (find out how close objects are)

			const guard = guards[ i ];

			const squaredDistance = playerProjectile.position.squaredDistanceTo( guard.position );
			const range = playerProjectile.boundingRadius + guard.boundingRadius;

			if ( squaredDistance <= ( range * range ) ) {

				// second more expensive test (only performed if objects are close enough)

				if ( playerProjectile.obb.intersectsBoundingSphere( guard.boundingSphere ) === true ) {

					playerProjectile.sendMessage( guard, 'hit' );
					this.removeProjectile( playerProjectile );
					return;

				}

			}

		}

		// pursuer

		for ( let i = 0, l = pursuers.length; i < l; i ++ ) {

			// first test (find out how close objects are)

			const pursuer = pursuers[ i ];

			const squaredDistance = playerProjectile.position.squaredDistanceTo( pursuer.position );
			const range = playerProjectile.boundingRadius + pursuer.boundingRadius;

			if ( squaredDistance <= ( range * range ) ) {

				// second more expensive test (only performed if objects are close enough)

				if ( playerProjectile.obb.intersectsBoundingSphere( pursuer.boundingSphere ) === true ) {

					playerProjectile.sendMessage( pursuer, 'hit' );
					this.removeProjectile( playerProjectile );
					return;

				}

			}

		}

		// obstacles

		for ( let i = 0, l = obstacles.length; i < l; i ++ ) {

			// first test (find out how close objects are)

			const obstacle = obstacles[ i ];

			const squaredDistance = playerProjectile.position.squaredDistanceTo( obstacle.position );
			const range = playerProjectile.boundingRadius + obstacle.boundingRadius;

			if ( squaredDistance <= ( range * range ) ) {

				// second more expensive test (only performed if objects are close enough)

				if ( playerProjectile.obb.intersectsOBB( obstacle.obb ) === true ) {

					this.removeProjectile( playerProjectile );
					return;

				}

			}

		}

	}

	_checkGameStatus() {

		const player = this.player;
		const guards = this.guards;
		const pursuers = this.pursuers;

		if ( player.healthPoints === 0 ) {

			this.active = false;
			this.gameOver = true;
			this.ui.gameOver.classList.remove( 'hidden' );
			this.controls.exit();

		} else {

			// check guard protection

			if ( this.guardsProtected === true && pursuers.length === 0 ) {

				// disable protection when all pursuers are destroyed

				this.guardsProtected = false;

				for ( let i = 0, l = guards.length; i < l; i ++ ) {

					guards[ i ].disableProtection();

				}

			}

			// all guards have been destroyed

			if ( guards.length === 0 ) {

				// advance

				this.currentStage ++;

				// halt simulation

				this.active = false;

				// restore hit points after clearing a stage

				this.player.heal();

				if ( this.currentStage > this.maxStage ) {

					// game completed

					this.gameOver = true;

					this.controls.exit();
					this.ui.gameComplete.classList.remove( 'hidden' );

				} else {

					// load next stage

					this.ui.hackingComplete.classList.remove( 'hidden' );

					setTimeout( () => {

						this._loadStage( this.currentStage );
						this.ui.hackingComplete.classList.add( 'hidden' );

					}, 1000 );

				}

			}

		}

	}

	_loadStage( id ) {

		this._clearStage();

		switch ( id ) {

			case 1:
				this._loadStage01();
				break;

			case 2:
				this._loadStage02();
				break;

			case 3:
				this._loadStage03();
				break;

			case 4:
				this._loadStage04();
				break;

			case 5:
				this._loadStage05();
				break;

			case 6:
				this._loadStage06();
				break;

			case 7:
				this._loadStage07();
				break;

			case 8:
				this._loadStage08();
				break;

			default:
				console.error( 'Unknown level ID', id );

		}

		this.active = true;

	}

	_clearStage() {

		const guards = this.guards;
		const pursuers = this.pursuers;
		const obstacles = this.obstacles;
		const enemyProjectiles = this.enemyProjectiles;
		const enemyDestructibleProjectiles = this.enemyDestructibleProjectiles;
		const playerProjectiles = this.playerProjectiles;

		this.guardsProtected = false;

		for ( let i = ( guards.length - 1 ); i >= 0; i -- ) {

			this.removeGuard( guards[ i ] );

		}

		for ( let i = ( pursuers.length - 1 ); i >= 0; i -- ) {

			this.removePursuer( pursuers[ i ] );

		}

		for ( let i = ( obstacles.length - 1 ); i >= 0; i -- ) {

			this.removeObstacle( obstacles[ i ] );

		}

		for ( let i = ( enemyProjectiles.length - 1 ); i >= 0; i -- ) {

			this.removeProjectile( enemyProjectiles[ i ] );

		}

		for ( let i = ( enemyDestructibleProjectiles.length - 1 ); i >= 0; i -- ) {

			this.removeProjectile( enemyDestructibleProjectiles[ i ] );

		}

		for ( let i = ( playerProjectiles.length - 1 ); i >= 0; i -- ) {

			this.removeProjectile( playerProjectiles[ i ] );

		}

		this._updateObstaclesMeshes( true );

		this.player.particleSystem.clear();

	}

	_updateObstaclesMeshes( force ) {

		let needsUpdate = force || false;

		const obstacleCount = this.obstacles.length;

		for ( let i = 0; i < obstacleCount; i ++ ) {

			const obstacle = this.obstacles[ i ];

			if ( obstacle.needsUpdate === true ) {

				obstacle.updateBoundingVolumes(); // ensure bounding volume is up-to-date

				this.obstacleMesh.setMatrixAt( i, obstacle.worldMatrix );
				obstacle.needsUpdate = false;
				needsUpdate = true;

			}

		}

		if ( needsUpdate === true ) {

			this.obstacleMesh.count = obstacleCount;
			this.obstacleMesh.instanceMatrix.needsUpdate = true;

		}

	}

	_updateProjectileMeshes() {

		// player projectiles

		const playerProjectileCount = this.playerProjectiles.length;

		for ( let i = 0; i < playerProjectileCount; i ++ ) {

			const projectile = this.playerProjectiles[ i ];

			this.playerProjectileMesh.setMatrixAt( i, projectile.worldMatrix );

		}

		this.playerProjectileMesh.count = playerProjectileCount;
		this.playerProjectileMesh.instanceMatrix.needsUpdate = true;

		// enemy projectiles

		const enemyProjectileCount = this.enemyProjectiles.length;


		for ( let i = 0; i < enemyProjectileCount; i ++ ) {

			const projectile = this.enemyProjectiles[ i ];
			this.enemyProjectileMesh.setMatrixAt( i, projectile.worldMatrix );

		}

		this.enemyProjectileMesh.count = enemyProjectileCount;
		this.enemyProjectileMesh.instanceMatrix.needsUpdate = true;

		// enemy destructible projectiles

		const enemyDestructibleProjectileCount = this.enemyDestructibleProjectiles.length;

		for ( let i = 0; i < enemyDestructibleProjectileCount; i ++ ) {

			const projectile = this.enemyDestructibleProjectiles[ i ];
			this.enemyDestructibleProjectileMesh.setMatrixAt( i, projectile.worldMatrix );

		}

		this.enemyDestructibleProjectileMesh.count = enemyDestructibleProjectileCount;
		this.enemyDestructibleProjectileMesh.instanceMatrix.needsUpdate = true;

	}

	_enforceNonPenetrationConstraint() {

		const guards = this.guards;
		const pursuers = this.pursuers;

		// guards

		for ( let i = 0, il = guards.length; i < il; i ++ ) {

			const guard = guards[ i ];

			for ( let j = 0, jl = guards.length; j < jl; j ++ ) {

				const entity = guards[ j ];

				if ( guard !== entity ) {

					this._checkOverlappingEntites( guard, entity );

				}


			}

			for ( let j = 0, jl = pursuers.length; j < jl; j ++ ) {

				this._checkOverlappingEntites( guard, pursuers[ j ] );

			}

		}

		// pursuer

		for ( let i = 0, il = pursuers.length; i < il; i ++ ) {

			const pursuer = pursuers[ i ];

			for ( let j = 0, jl = guards.length; j < jl; j ++ ) {

				const entity = guards[ j ];

				this._checkOverlappingEntites( pursuer, entity );

			}

			for ( let j = 0, jl = pursuers.length; j < jl; j ++ ) {

				const entity = pursuers[ j ];

				if ( pursuer !== entity ) {

					this._checkOverlappingEntites( pursuer, entity );

				}

			}

		}

	}

	_checkOverlappingEntites( entity1, entity2 ) {

		toVector.subVectors( entity1.position, entity2.position );

		const distance = toVector.length();
		const range = entity1.boundingRadius + entity2.boundingRadius;

		const overlap = range - distance;

		if ( overlap >= 0 ) {

			toVector.divideScalar( distance || 1 ); // normalize
			displacement.copy( toVector ).multiplyScalar( overlap );
			entity1.position.add( displacement );

		}

	}

}

function sync( entity, renderComponent ) {

	renderComponent.matrix.copy( entity.worldMatrix );

}

function onRestart() {

	this._stopAnimation();

	this.controls.connect();

	this.player.heal();

	this.gameOver = false;

	this.currentStage = 1;

	this._loadStage( this.currentStage );

	this.ui.gameComplete.classList.add( 'hidden' );
	this.ui.gameOver.classList.add( 'hidden' );

	const audio = this.assetManager.audios.get( 'buttonClick' );
	this.playAudio( audio );

}

function onContinueButtonClick() {

	this.controls.connect();

	const audio = this.assetManager.audios.get( 'buttonClick' );
	this.playAudio( audio );

}

function onWindowResize() {

	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();

	this.renderer.setSize( window.innerWidth, window.innerHeight );

}

function startAnimation() {

	this._requestID = requestAnimationFrame( this._startAnimation );

	this.update();

}

function stopAnimation() {

	cancelAnimationFrame( this._requestID );

}

export default new World();
