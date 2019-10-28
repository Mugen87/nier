/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import world from './World.js';

const startButton = document.getElementById( 'startscreen-start' );
startButton.addEventListener( 'click', () => {

	world.init();
	document.getElementById( 'startScreen' ).remove();

} );
