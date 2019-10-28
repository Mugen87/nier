/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import world from './core/World.js';

const startButton = document.getElementById( 'start-screen-start' );
startButton.addEventListener( 'click', () => {

	world.init();

} );
