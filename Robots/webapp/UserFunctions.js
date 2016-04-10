TECH_DROP_CHANCE = .5;
MOVEABLE_ROCK = 2;
IMOVABLE_ROCK = 1;
PLAIN = 0;
TREE = 3;
PRESSURE_PLATE = 4;
PIT_FALL = 5;
GATE_UP = 6;
GATE_DOWN = 7;
RATIO = 16;
TILE_SIZE = 4;
TILES_IN_MAP = 5;
IMAGES = 
[
	'WorldObjects/Grass.PNG',
	'WorldObjects/Just_Rock.PNG',
	'WorldObjects/Moveable_rock.PNG',
	'WorldObjects/Tree.PNG',
	'WorldObjects/P_Plate.png',
	'WorldObjects/Pitfall.PNG',
	'WorldObjects/Gate_Up.PNG',
	'WorldObjects/Gate_Down.PNG'
];
	
map = [];
entities = [];
BOARDER_IMG = 'Boarder.png';
gameBoard = document.getElementById('gameMap');



function putOnScreen(imgStr, xLoc, yLoc, click) {
	var img = document.createElement('img');
	img.className = 'cell';
	img.src = imgStr;
	img.style.top = yLoc + 'em';
	img.style.left = xLoc + 'em';
	img.onclick = click;
	
	gameBoard.appendChild(img);
}

function render() {
	/*(function (){
		var i = document.getElementsByClassName('cell');
		for (var k  = 0, kMax = i.length; k < kMax; k++)
			i[k].remove();
	})();*/
	$('.cell').remove();

	var show = [];
	for (var r in entities)
		if (entities[r].render)
			show.push(entities[r]);

	var screensLong = (window.innerWidth / (TILE_SIZE * RATIO)) | 0;
	
	screensLong--;
	screensLong /= TILES_IN_MAP + 1;
	screensLong |= 0;
	if (screensLong === 0)
		screensLong = 1;
	var rowsize = Math.ceil(Math.sqrt(show.length));
	if (rowsize > screensLong)
		rowsize = screensLong;

	var xLoc = 0;
	var yLoc = 0;
	for (r in show) {
		drawBot(show[r], xLoc, yLoc);
		xLoc++;
		xLoc %= rowsize;
		if (xLoc === 0)
			yLoc++;
	}
}

var drawBot = function (bot, x, y) {
	

	var iStart = Math.max(bot.x - 2, 0),
		iMax = Math.min(bot.x + 3, map[0].length),
		jStart = Math.max(bot.y - 2, 0),
		jMax = Math.min(bot.y + 3, map.length);
	x *= TILE_SIZE * (TILES_IN_MAP + 1);
	y *= TILE_SIZE * (TILES_IN_MAP + 1);
	drawVertBorder(x, y);
	drawHortBorder(x, y);
	drawVertBorder(x + TILE_SIZE * (TILES_IN_MAP + 1), y);
	drawHortBorder(x, y + TILE_SIZE * (TILES_IN_MAP + 1));
	x += TILE_SIZE;
	y += TILE_SIZE;
	for (var i = iStart, X = x; i < iMax; i++, X += TILE_SIZE) {
		for (var j = jStart, Y = y; j < jMax; j++, Y += TILE_SIZE) {
			var k = map[j][i];
			if (k.entity instanceof Object)
				if (k.entity === bot)
					putOnScreen(roboImg(k.entity), X, Y, function () { overlay(bot); });
				else
					putOnScreen(roboImg(k.entity), X, Y);
			else {
				putOnScreen(IMAGES[k.image], X, Y);
				if (k.tech !== null)
					putOnScreen(k.tech.val, X, Y);
			}
		}
	}
};

var drawHortBorder = function (x, y) {
	for (var i = 0; i < TILES_IN_MAP + 2; i++) {
		putOnScreen(BOARDER_IMG, x, y);
		x += TILE_SIZE;
	}
};

var drawVertBorder = function (x, y) {
	for (var i = 0; i < TILES_IN_MAP + 2; i++) {
		putOnScreen(BOARDER_IMG, x, y);
		y += TILE_SIZE;
	}
};

/**
 * Gets the data the robot can see
 * returns tile[][]
 */
function getInfo(bot) {
	var iStart = Math.max(bot.x - 2, 0),
		iMax = Math.min(bot.x + 3, map.length),
		jStart = Math.max(bot.y - 2, 0),
		jMax = Math.min(bot.y + 3, map[0].length);
	var sightRange = [];
	
	for (var j = jStart; j < jMax; j++) {
		var t = [];
		for (var i = iStart; i < iMax; i++) {
			t.push(map[j][i]);
		}
		sightRange.push(t);
	}
	
	return sightRange;
}

/**
 * Creates a robot object
 * name - identifier for robot
 * img  - image used for robot on map
 * i    - index in entity aray
 */
var makeRobot = function (name, i, img, xPos, yPos) {
	return {
		index: i,
		'name': name,
		x: xPos,
		y: yPos,
		code: "",
		tech: [],
		data: {},
		hp: 1,
		movement: 3,
		'img': img,
		nextMove: function () { },
		robotHold: false,
		direction: 0,
		type: 'Robot',
		damage: 1,
		render: true
	};
};

function roboImg(robit) {
	return 'Skins/' + robit.direction + robit.img;
}

/**
 * sets function of a robot
 * robot - robot who's functunality is set
 * theirCode - code they type up for robot
 */
var setFunc = function (robot, theirCode) {
	robot.code = theirCode;
	robot.nextMove = Function('input', 'data', theirCode);
};

/**
 * executed every turn/game tick
 */
var gameTick = function () {
	for (var rob in entities) {
		var t = entities[rob];
		if (!(t.robotHold)) {
			applyAction(t, t.nextMove(getInfo(t), t.data));
		}
	}

	render();
};

var applyAction = function (robot, actions) {
	var i = robot.movement;
	for (var action in actions) {
		if (actions[action].toLowerCase() === 'move') {
			doAction(robot, moveForward);
		} else if (actions[action].toLowerCase() === 'right') {
			robot.direction = (robot.direction + 1) % 4;
		} else if (actions[action].toLowerCase() === 'left') {
			robot.direction = (robot.direction + 3) % 4;
		} else if (actions[action].toLowerCase() === 'attack') {
			doAction(robot, attack);
		} else if (actions[action].toLowerCase() === 'push') {
			doAction(robot, push);
		} else if (actions[action].toLowerCase() === 'talk') {
			doAction(robot, talk);
			i++;
		} else if (actions[action].toLowerCase() === 'grab') {
			doAction(robot, pickup);
		} else if (actions[action].toLowerCase() === 'fuck') {
			alert('damn right');
		} else {
		//throw error?
		}
		
		if (--i === 0)
			break;
	}
};

function talk(robot, x, y) {
	var mapLoc = map[y][x];
	
	if (mapLoc.talk)
		mapLoc.talk();
}

function imagePush(tile, image) {
	tile.background = { val: tile.image, back: tile.background };
	tile.image = image;
}

function imagePop(tile) {
	var img = tile.image;
	if (tile.background !== null) {
		tile.image = tile.background.val;
		tile.background = tile.background.back;
	} else {
		tile.image = PLAIN;
		console.log("ERROR poped when not allowed");
	}
	return img;
}

function push(robot, x, y) {
	var mapLoc = map[y][x];
	if (mapLoc.pushable || mapLoc.entity instanceof Object) {
		doAction({ 'x': x, 'y': y, direction: robot.direction }, function (cords, x2, y2) {
			var ml = map[y2][x2];
			if (ml.entity === null) {

				

				if (mapLoc.entity instanceof Object) {
					var e = ml.entity = mapLoc.entity;
					mapLoc.entity = null;
					e.x = x2;
					e.y = y2;
				} else {
					
					imagePush(ml, imagePop(mapLoc));

					ml.pushable = mapLoc.pushable;
					mapLoc.pushable = false;
					
					ml.destroyable = mapLoc.destroyable;
					mapLoc.destroyable = false;
				}
			}
			
			if (ml.moveOn)
				ml.moveOn();
			
			if (mapLoc.moveOff)
				mapLoc.moveOff();
		});
	}
	if (mapLoc.onPush)
		mapLoc.onPush();
}

var attack = function (robot, x, y) {
	var mapLoc = map[y][x];
	
	if (mapLoc.destroyable) {
		imagePop(mapLoc);
		
		mapLoc.destroyable = false;
		mapLoc.entity = null;
	}

	else if (mapLoc.entity instanceof Object) {
		mapLoc.entity.hp -= robot.damage;
		if (mapLoc.entity.hp <= 0)
			kill(mapLoc.entity);
	}
	
	
	if (mapLoc.onAttack)
		mapLoc.onAttack();
};

function kill(robot) {
	//drops tech
	for (var i = 0; i < robot.tech.length; i++) {
		if (Math.random() < TECH_DROP_CHANCE) {
			var deltaX = ((Math.random() * 3) | 0) - 1;
			var deltaY = ((Math.random() * 3) | 0) - 1;
			techPush(map[robot.y + detlaY][robot.x + detlaX], robot.tech[i]);
		}
	}

	for (var i = robot.index + 1, iMax = entities.length; i < iMax; i++)
		entities[i - 1] = entities[i];

	entities.pop();

	var m = map[robot.y][robot.x];
	m.entity = null;
	if (m.moveOff)
		m.moveOff();
}

var doAction = function (robot, fn) {
	var x = robot.x,
		y = robot.y;
	if (robot.direction === 0) {
		fn(robot, x, y - 1);
	} else if (robot.direction === 1) {
		fn(robot, x + 1, y);
	} else if (robot.direction == 2) {
		fn(robot, x, y + 1)
	} else {
		fn(robot, x - 1, y);
	}
};


function moveForward(robot, x, y) {
	var mapLoc = map[y][x];
	
	if (mapLoc.entity === null) {
		var m = map[robot.y][robot.x];
		

		m.entity = null;
		if (m.moveOff)
			m.moveOff();
		
		mapLoc.entity = robot;
		robot.x = x;
		robot.y = y;
		if (mapLoc.moveOn)
			mapLoc.moveOn();
	}
}

function gateDown(x, y) {
	return function () {
		var gate = map[y][x];
		gate.image = GATE_DOWN;
		gate.entity = null;
	};
}

function gateUp(x, y) {
	return function () {
		
		var gate = map[y][x];

		if (gate.entity instanceof Object) {
			kill(gate.entity);
		}

		gate.image = GATE_UP;
		
		gate.pushable = false;
		gate.destroyable = false;
		
		gate.entity = false;
	};
}

function gateSwtich(x, y) {
	if (gate.entity === false)
		return gateDown(x, y);
	else
		return gateUp(x, y);
}

function hole() {
	return function () {
		
		if (this.entity instanceof Object) {
			kill(this.entity);
		} else {
			this.entity = null;
		}
		
		this.pushable = false;
		this.destroyable = false;
		this.image = PLAIN;
		this.background = null;
		
		this.moveOn = null;
	};
}


var makeTile = function (val) {
	return {
		background: null,	//stack for backgrounds
		image: val,	//an integer representing image used
		tech: null,	//Technology stack on tile
		entity: null,	//entity on this square, false means it can not have an entity, null means it does not
		onPush: null,	//a trigger for on push
		moveOn: null,	//a trigger for move on
		moveOff: null,	//a trigger for moving off
		onAttack: null, //a trigger for attacking
		onPickup: null,	//a trigger for pick up
		talk: null,		//a trigger for talk
		pushable: false,	//if it is a pushable block
		destroyable: false,	//if it is a destroyable block
	};
};

var makeTech = function (img, func) {
	return {
		image: img,	//image for tech (nullable string)
		onPickup: func,	//trigger for pick up, takes in robot
	};
};

function techPush(tile, tech) {
	tile.tech = { val: tech, back: tile.tech };
}

function techPop(tile){
	if (tile.tech === null)
		console.log('ERROR: popped from tech stack at wrong time');
	else {
		var o = tile.tech.val;
		tile.tech = tile.tech.back;
		return o;
	}
	return null;
}

var pickup = function (robot, x, y) {
	var mapLoc = map[y][x];
	if (mapLoc.tech !== null) {
		var a = techPop(mapLoc);
		robot.tech.push(a);
		a.onPickup(robot);
	}
	
	if (mapLoc.onPickup)
		mapLoc.onPickup();
};

var black = function () {
	return { background: null, image: IMOVABLE_ROCK, entity: false, pushable: false, destroyable: false, tech: null };
};

var red = function (robotName, robotImage, x, y) {
	var myRobo;
	entities.push(myRobo = makeRobot(robotName, entities.length, robotImage, x, y));
	
	setFunc(myRobo, 'return [\'move\',\'right\',\'push\']');
	
	return { background: null, image: PLAIN, entity: myRobo, pushable: false, destroyable: false, tech: null };
};

var pink = function (gateX, gateY) {
	return { background: null, image: PRESSURE_PLATE, entity: null, moveOn: gateUp(gateX, gateY), moveOff: gateDown(gateX, gateY), pushable: false, destroyable: false, tech: null };
};

var teal = function () {
	return { background: null, image: GATE_DOWN, entity: null, pushable: false, destroyable: false, tech: null };
};

var blue = function () {
	return { background: null, image: PIT_FALL, entity: null, moveOn: hole(), pushable: false, destroyable: false, tech: null };
};

var purple = function () {
	return { background: { val: PLAIN, back: null }, image: MOVEABLE_ROCK, entity: false, pushable: true, destroyable: false, tech: null };
};

var green = function () {
	return { background: { val: PLAIN, back: null }, image: TREE, entity: false, pushable: false, destroyable: true, tech: null };
};

var white = function () {
	return { background: null, image: PLAIN, entity: null, pushable: false, destroyable: false, tech: null };
};

var yellow = function (){
	var TECH = [makeTech('healthBoost.png', function (robot) {
			robot.hp++;
		}), makeTech('attackBoost.png', function (robot) {
			robot.damage++;
		}), makeTech('movementBoost.png', function (robot) {
			robot.movement++;
		})];
	var output = white();
	var r = Math.random() * 3;
	r |= 0;
	techPush(output, TECH[r])
	return output;
}

map = [
	[
		black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black()
	], [
		black(),red('android', 'android.png', 1, 1),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),green(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),red('rack', 'Robot_Black_Red.png', 23, 1),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),green(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),black(),white(),white(),blue(),white(),white(),green(),white(),white(),blue(),white(),white(),black(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),black(),white(),white(),white(),white(),white(),white(),green(),white(),white(),white(),white(),white(),white(),black(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),black(),white(),white(),white(),white(),white(),white(),white(),green(),white(),white(),white(),white(),white(),white(),white(),black(),white(),white(),white(),black()
	], [
		black(),white(),white(),black(),white(),white(),purple(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),purple(),white(),white(),black(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),black(),black(),black(),black(),black(),black(),black(),black(),black(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),black(),white(),white(),white(),white(),white(),white(),white(),black(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),black(),pink(8,11),white(),white(),white(),white(),white(),pink(15,11),black(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),black(),white(),white(),white(),white(),teal(),white(),white(),yellow(),yellow(),yellow(),white(),white(),teal(),white(),white(),white(),white(),black(),white(),white(),black()
	], [
		black(),green(),black(),black(),white(),white(),white(),white(),black(),white(),white(),yellow(),yellow(),yellow(),white(),white(),black(),white(),white(),white(),white(),black(),black(),green(),black()
	], [
		black(),white(),white(),black(),white(),white(),white(),white(),teal(),white(),white(),yellow(),yellow(),yellow(),white(),white(),teal(),white(),white(),white(),white(),black(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),black(),pink(8,15),white(),white(),white(),white(),white(),pink(15,15),black(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),black(),white(),white(),white(),white(),white(),white(),white(),black(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),black(),black(),black(),black(),black(),black(),black(),black(),black(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),black(),white(),white(),purple(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),purple(),white(),white(),black(),white(),white(),black()
	], [
		black(),white(),white(),white(),black(),white(),white(),white(),white(),white(),white(),white(),green(),white(),white(),white(),white(),white(),white(),white(),black(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),black(),white(),white(),white(),white(),white(),white(),green(),white(),white(),white(),white(),white(),white(),black(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),black(),white(),white(),blue(),white(),white(),green(),white(),white(),blue(),white(),white(),black(),white(),white(),white(),white(),white(),black()
	], [
		black(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),green(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),black()
	], [
		black(),red('robot', 'Robot_Blue.png', 1, 23),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),green(),white(),white(),white(),white(),white(),white(),white(),white(),white(),white(),red('black', 'Robot_Black.png', 23, 23),black()
	], [
		black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black(),black()
	]
];

render();