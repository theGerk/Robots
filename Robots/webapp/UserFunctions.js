var MOVEABLE_ROCK = 2,
	IMOVABLE_ROCK = 1,
	PLAIN = 0,
	TREE = 3,
	PRESSURE_PLATE = 4,
	PIT_FALL = 5,
	GATE_UP = 6,
	GATE_DOWN = 7;

var IMAGES = 
[
	'WorldObjects\\Grass.PNG',
	'WorldObjects\\Just_Rock.PNG',
	'WorldObjects\\Moveable_rock.PNG',
	'WorldObjects\\Tree.PNG',
	'WorldObjects\\P_Plate.png',
	'WorldObjects\\Pitfall.PNG',
	'WorldObjects\\Gate_Up.PNG',
	'WorldObjects\\Gate_Down.PNG'
];

var map = [];
var entities = [];
var backgroundImgs = [];

/**
 * Gets the data the robot can see
 * returns tile[][]
 */
function getInfo(robot) {
	var MaxX = robot.x + 2;
	var MaxY = robot.y + 2;
	var sightRange = [];
	
	for (var y = robot.y - 2; y <= MaxY; y++) {
		var t = [];
		for (var x = robot.x - 2; x <= MaxX; x++) {
			t.push(map[y][x]);
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
		tech: {},
		data: {},
		hp: 1,
		movement: 3,
		'img': img,
		nextMove: function () { },
		robotHold: false,
		direction: 0,
		type: 'Robot',
		damage: 1
	};
};

var makeTile = function (val) {
	return {
		background: null,
		image: val,	//an integer representing image used
		entity: null,	//entity on this square, false means it can not have an entity, null means it does not
		onPush: null,	//a trigger for on push
		moveOn: null,	//a trigger for move on
		moveOff: null,	//a trigger for moving off
		onAttack: null, //a trigger for attacking
		talk: null,		//a trigger for talk
		pushable: false,	//if it is a pushable block
		destroyable: false,	//if it is a destroyable block
	};
};

/**
 * sets function of a robot
 * robot - robot who's functunality is set
 * theirCode - code they type up for robot
 */
var setFunc = function (robot, theirCode) {
	robot.code = theirCode;
	robot.nextMove = function (input, data) {
		eval(theirCode);
	};
};

/**
 * executed every turn/game tick
 */
var gameTick = function (robots) {
	for (var rob in robots) {
		var t = robots[rob];
		if (!(t.robotHold)) {
			applyAction(t, t.nextMove(getInfo(t), t.data));
		}
	}
};

var applyAction = function (actions, robot) {
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
		} else if (action[action].toLowerCase() == 'fuck') {
			alert('damn right');
		} else {
		//throw error?
		}
		
		if (--i === 0)
			break;
	}
};

function talk(robot, x, y){
	var mapLoc = map[y][x];

	if (mapLoc.talk !== null)
		mapLoc.talk();
}

function imagePush(tile, image) {
	tile.background = { val: tile.image, back: tile.background };
	tile.image = image;
}

function imagePop(tile){
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

function push(robot, x, y)
{
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

			if (ml.moveOn !== null)
				ml.moveOn();

			if (mapLoc.pushOff !== null)
				mapLoc.pushOff();
		});
	}
	if (mapLoc.onPush !== null)
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
			kill(entity);
	}

	
	if (mapLoc.onAttack !== null)
		mapLoc.onAttack();
};

function kill(robot) {
	var i = robot.index;
	entities[i] = entities[entities.length - 1];	//causes turn reordering bug
	entities[i].index = i;
	entities.pop();
	var m = map[robot.y][robot.x];
	m.entity = null;
	if (m.moveOff !== null)
		m.moveOff();
}

var doAction = function (robot, fn) {
	var x = robot.x,
		y = robot.y;
	if (robot.direction === 0) {
		fn(robot, x, y + 1);
	} else if (robot.direction === 1) {
		fn(robot, x + 1, y);
	} else if (robot.direction == 2) {
		fn(robot, x, y - 1)
	} else {
		fn(robot, x - 1, y);
	}
};


function moveForward (robot, x, y)
{
	var mapLoc = map[y][x];

	if (mapLoc.entity === null) {
		var m = map[robot.x][robot.y];
		m.entity = null;
		if (m.moveOff !== null)
			m.moveOff();

		mapLoc.entity = robot;
		robot.x = x;
		robot.y = y;
		if (mapLoc.moveOn != null)
			mapLoc.moveOn();
	}
}

function gateDown(x, y)
{
	return function () {
		var gate = map[y][x];
		gate.image = GATE_DOWN;
		gate.entity = null;
	};
}

function gateUp(x, y)
{
	return function () {
		var gate = map[y][x];
		gate.image = GATE_UP;
		
		gate.pushable = false;
		gate.destroyable = false;
		
		if (gate.entity instanceof Object) {
			kill(gate.entity);
		}
		
		gate.entity = false;
	};
}

function gateSwtich(x, y) {
	if (gate.entity === false)
		return gateDown(x, y);
	else
		return gateUp(x, y);
}

function hole(){
	return function () {
		this.pushable = false;
		this.destroyable = false;
		this.image = PLAIN;
		this.background = null;

		if (this.entity instanceof Object) {
			kill(this.entity);
		} else {
			this.entity = null;
		}

		this.moveOn = null;
	};
}