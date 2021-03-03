import db from './DataAccess.js';
import UserInterface from './UserInterface.js';
import Player from './Player.js';

const ui = new UserInterface(db);
const player = new Player(db);
ui.initialize();
player.initialize();
