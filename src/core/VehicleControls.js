/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { EventDispatcher, Vector3, Logger, MathUtils } from 'yuka';

const direction = new Vector3();
const target = new Vector3();
const currentGamepadValues = {
	buttonPressed: false,
	leftStickX: 0,
	leftStickY: 0,
	rightStickX: 0,
	rightStickY: 0,
};

class VehicleControls extends EventDispatcher {

	constructor( owner = null, camera = null ) {

		super();

		this.owner = owner;
		this.camera = camera;

		this.cameraOffset = new Vector3( 0, 20, 10 );
		this.cameraMovementSpeed = 2.5;
		this.rotationSpeed = 5;
		this.brakingForce = 10;

		this.movementX = 0; // mouse left/right
		this.movementY = - 1; // mouse up/down

		this.input = {
			forward: false,
			backward: false,
			right: false,
			left: false,
			mouseDown: false
		};

		this.gamepadActive = false;

		this._mouseUpHandler = onMouseUp.bind( this );
		this._mouseDownHandler = onMouseDown.bind( this );
		this._mouseMoveHandler = onMouseMove.bind( this );
		this._pointerlockChangeHandler = onPointerlockChange.bind( this );
		this._pointerlockErrorHandler = onPointerlockError.bind( this );
		this._keyDownHandler = onKeyDown.bind( this );
		this._keyUpHandler = onKeyUp.bind( this );
		this._gamepadconnectedHandler = onGamepadconnected.bind( this );
		this._gamepaddisconnectedHandler = onGamepaddisconnected.bind( this );

		window.addEventListener( 'gamepadconnected', this._gamepadconnectedHandler );
		window.addEventListener( 'gamepaddisconnected', this._gamepaddisconnectedHandler );

	}

	connect() {

		document.addEventListener( 'mouseup', this._mouseUpHandler, false );
		document.addEventListener( 'mousedown', this._mouseDownHandler, false );
		document.addEventListener( 'mousemove', this._mouseMoveHandler, false );
		document.addEventListener( 'pointerlockchange', this._pointerlockChangeHandler, false );
		document.addEventListener( 'pointerlockerror', this._pointerlockErrorHandler, false );
		document.addEventListener( 'keydown', this._keyDownHandler, false );
		document.addEventListener( 'keyup', this._keyUpHandler, false );

		document.body.requestPointerLock();

	}

	disconnect() {

		document.removeEventListener( 'mouseup', this._mouseUpHandler, false );
		document.removeEventListener( 'mousedown', this._mouseDownHandler, false );
		document.removeEventListener( 'mousemove', this._mouseMoveHandler, false );
		document.removeEventListener( 'pointerlockchange', this._pointerlockChangeHandler, false );
		document.removeEventListener( 'pointerlockerror', this._pointerlockErrorHandler, false );
		document.removeEventListener( 'keydown', this._keyDownHandler, false );
		document.removeEventListener( 'keyup', this._keyUpHandler, false );

	}

	exit() {

		document.exitPointerLock();

	}

	update( delta ) {

		if ( this.gamepadActive === true ) {

			// gamepad input

			this.pollGamepad();

			direction.x = currentGamepadValues.leftStickX;
			direction.z = currentGamepadValues.leftStickY;

			//

			target.set( 0, 0, 0 );

			target.x = currentGamepadValues.rightStickX;
			target.z = currentGamepadValues.rightStickY;

			if ( target.squaredLength() !== 0 ) {

				target.add( this.owner.position );

				this.owner.lookAt( target );

			}

		} else {

			// mouse input

			const input = this.input;

			direction.z = Number( input.backward ) - Number( input.forward );
			direction.x = Number( input.right ) - Number( input.left );
			direction.normalize();

			//

			target.set( this.movementX, 0, this.movementY ).normalize();
			target.add( this.owner.position );

			this.owner.lookAt( target );

		}

		// update player position

		if ( direction.squaredLength() === 0 ) {

			// brake

			this.owner.velocity.x -= this.owner.velocity.x * this.brakingForce * delta;
			this.owner.velocity.z -= this.owner.velocity.z * this.brakingForce * delta;

		} else {

			this.owner.velocity.add( direction );

		}

		// update shooting

		if ( this.input.mouseDown || currentGamepadValues.buttonPressed === true ) {

			this.owner.shoot();

		}

		// update camera

		const offsetX = ( this.camera.position.x - this.cameraOffset.x ) - this.owner.position.x;
		const offsetZ = ( this.camera.position.z - this.cameraOffset.z ) - this.owner.position.z;

		if ( offsetX !== 0 ) this.camera.position.x -= ( offsetX * delta * this.cameraMovementSpeed );
		if ( offsetZ !== 0 ) this.camera.position.z -= ( offsetZ * delta * this.cameraMovementSpeed );

	}

	pollGamepad( ) {

		const gamepad = getGamepad(); // assuming PS4 gamepad

		if ( gamepad ) {

			const axes = gamepad.axes;

			currentGamepadValues.leftStickX = ( Math.abs( axes[ 0 ] ) < 0.2 ) ? 0 : axes[ 0 ]; // ignore small input values
			currentGamepadValues.leftStickY = ( Math.abs( axes[ 1 ] ) < 0.2 ) ? 0 : axes[ 1 ];
			currentGamepadValues.rightStickX = ( Math.abs( axes[ 2 ] ) < 0.2 ) ? 0 : axes[ 2 ];
			currentGamepadValues.rightStickY = ( Math.abs( axes[ 3 ] ) < 0.2 ) ? 0 : axes[ 3 ];

			const buttons = gamepad.buttons;

			currentGamepadValues.buttonPressed = buttons[ 5 ].pressed; // R1

		}

	}

	reset() {

		this.input.forward = false;
		this.input.backward = false;
		this.input.left = false;
		this.input.right = false;
		this.input.mouseDown = false;

		currentGamepadValues.leftStickX = 0;
		currentGamepadValues.leftStickY = 0;
		currentGamepadValues.rightStickX = 0;
		currentGamepadValues.rightStickY = 0;
		currentGamepadValues.button = false;

	}

	resetRotation() {

		this.movementX = 0;
		this.movementY = - 1;
		this.owner.rotation.fromEuler( 0, Math.PI, 0 );

	}

	setPosition( x, y, z ) {

		this.owner.position.set( x, y, z );

		this.camera.position.set( x, y, z ).add( this.cameraOffset );
		this.camera.lookAt( x, y, z );

	}

}

function getGamepad() {

	var gamepads = navigator.getGamepads && navigator.getGamepads();

	for ( var i = 0; i < 4; i ++ ) {

		var gamepad = gamepads[ i ];

		if ( gamepad ) return gamepad;

	}

	return null;

}

// handler

function onMouseDown( event ) {

	if ( event.which === 1 ) {

		this.input.mouseDown = true;

	}

}

function onMouseUp( event ) {

	if ( event.which === 1 ) {

		this.input.mouseDown = false;

	}

}

function onMouseMove( event ) {

	const x = event.movementX / screen.width;
	const y = event.movementY / screen.height;

	this.movementX += x * this.rotationSpeed;
	this.movementY += y * this.rotationSpeed;

	this.movementX = MathUtils.clamp( this.movementX, - 1, 1 );
	this.movementY = MathUtils.clamp( this.movementY, - 1, 1 );

}

function onPointerlockChange() {

	if ( document.pointerLockElement === document.body ) {

		this.dispatchEvent( { type: 'lock' } );

	} else {

		this.disconnect();

		this.reset();

		this.dispatchEvent( { type: 'unlock' } );

	}

}

function onPointerlockError() {

	Logger.warn( 'YUKA.VehicleControls: Unable to use Pointer Lock API.' );

}

function onGamepadconnected() {

	this.gamepadActive = true;

}

function onGamepaddisconnected() {

	this.gamepadActive = false;

}

function onKeyDown( event ) {

	switch ( event.keyCode ) {

		case 38: // up
		case 87: // w
			this.input.forward = true;
			break;

		case 37: // left
		case 65: // a
			this.input.left = true;
			break;

		case 40: // down
		case 83: // s
			this.input.backward = true;
			break;

		case 39: // right
		case 68: // d
			this.input.right = true;
			break;

	}

}

function onKeyUp( event ) {

	switch ( event.keyCode ) {

		case 38: // up
		case 87: // w
			this.input.forward = false;
			break;

		case 37: // left
		case 65: // a
			this.input.left = false;
			break;

		case 40: // down
		case 83: // s
			this.input.backward = false;
			break;

		case 39: // right
		case 68: // d
			this.input.right = false;
			break;

	}

}

export { VehicleControls };
