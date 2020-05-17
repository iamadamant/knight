var gameF = document.getElementById('game');
var skillPanel = document.getElementById('skillPanel');
var nick = document.getElementsByName('nickname');
var deathScreen = document.getElementById('deathScreen');
var winScreen = document.getElementById('winScreen');
var restartButtons = document.getElementsByName('restart');
gameF.style.width = px(window.innerWidth);
gameF.style.height = px(window.innerHeight);

deathScreen.style.width = px(window.innerWidth);
deathScreen.style.height = px(window.innerHeight);

winScreen.style.width = px(window.innerWidth);
winScreen.style.height = px(window.innerHeight);


//Не указанное или автоматическое значение
var auto = 'auto';

//направления движения
var directions = {
    'left': 65,
    'right': 68,
}

//превращяет числовые значения в значения, указанные в пикселях 
function px(value) {
    if (value == auto) {
        return value;
    }
    return value + 'px';
}

function arrayRandElement(arr) {
    var rand = Math.floor(Math.random() * arr.length);
    return arr[rand];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function print(text) {
    console.log(text);
}

function setNick() {
    var name = document.getElementById("name");
    nick.forEach(i => i.innerText = name.value);
}

//Базовый класс для всех объектов игры(т.е будут на игровом поле)
class GameObject {
    constructor(x = 0, y = 0, width = auto, height = auto) {
        this.x = x;
        this.y = y;
        //Ключевой кадр. Т.е кадр который отрисует класс Game во время вызова метода render
        this.frameRelationObject = null;
        this.height = height;
        this.width = width;
        this.animations = {};
    }

    render(gameField = gameF) {
        this.frameRelationObject.style.bottom = px(this.y);
        this.frameRelationObject.style.left = px(this.x);
        this.frameRelationObject.style.width = px(this.width);
        this.frameRelationObject.style.height = px(this.height);
        this.frameRelationObject = gameField.appendChild(this.frameRelationObject);
    }

    erase(gameField = gameF) {
        gameField.removeChild(this.frameRelationObject);
    }

    move(dx, dy = 0) {
        this.x += dx;
    }
}


//Анимированный спрайт(с анимацией)
class AnimatedSprite extends GameObject {

    constructor(name, frameCount) {
        super();
        this.name = name;
        this.images = [];
        //Сколько кадров в анимации
        this.frameCount = frameCount;
        this.fetchFrames();
        this.onendFunction = () => null;
        this.frame = 0;
        this.stop = false;
    }

    increaseFrame() {
        if (this.stop) {
            return;
        }
        if (this.frame == this.frameCount - 1) {
            this.frame = 0;
            this.end();
        } else {
            this.frame += 1;
        }
    }

    //При вызове меняет ключевой кадр
    render(x, y, width, height, direction) {
        var img = this.images[this.frame];
        img.style.width = px(width);
        img.style.height = px(height);
        img.style.bottom = px(y);
        img.style.left = px(x);
        if (direction == directions.left) {
            img.style.transform = 'scale(-1, 1)';
        } else {
            img.style.transform = 'scale(1, 1)';
        }
        this.increaseFrame();
        gameF.appendChild(img);
    }

    //Загружает все изображения в массив
    fetchFrames() {
        for (var i = 1; i <= this.frameCount; i++) {
            var img = document.createElement('img');
            img.src = 'animation/' + this.name + '/frame (' + i + ').png';
            img.style.position = 'absolute';
            this.images.push(img);
        }
    }

    onend(oef) {
        this.onendFunction = oef;
    }

    end() {
        this.onendFunction();
        this.onendFunction = () => null;
    }

    stopAnimation() {
        this.stop = true;
    }

    restoreAnimation() {
        this.stop = false;
    }
}

class Origin extends GameObject {
    constructor(max, value, regeneration, x, y, width = 150, height = 20, label = '') {
        super(x, y, width, height);
        this.value = value;
        this.max = max;
        this.regeneration = regeneration;
        this.frameRelationObject = document.createElement('progress');
        this.frameRelationObject.style.position = 'absolute';
        this.frameRelationObject.max = max;
        this.frameRelationObject.value = value;
        if (label != '') {
            this.setLabel(label);
        }
    }

    regenerate() {
        this.value += this.regeneration;
        if (this.value > this.max) {
            this.value = this.max;
        }
        this.frameRelationObject.value = this.value;
    }

    isEnough(count) {
        if (this.value - count <= 0) {
            return false;
        }
        return true;
    }

    reduce(count) {
        this.value -= count;
        if(this.value<0){
            this.value = 0;
        }
        this.frameRelationObject.value = this.value;
    }

    setLabel(label) {
        this.label = document.createElement('p');
        this.label.innerText = label;
        this.label.style.color = 'white';
        this.label.style.position = 'absolute';
        this.label.style.bottom = px(this.y);
        this.label.style.left = px(this.x + this.width + 5);
        document.body.appendChild(this.label);
    }

    increase(count) {
        this.value += count;
        if (this.value > this.max) {
            this.value = this.max;
        }
        this.frameRelationObject.value = this.value;
    }
}

class Skill extends GameObject {
    constructor(name, actionFunction) {
        super()
        this.frameRelationObject = document.createElement('img');
        this.frameRelationObject.src = 'img/' + name;
        this.frameRelationObject.className = 'skill';
        this.frameRelationObject.addEventListener('click', () => this.clickHandler());
        this.action = actionFunction;
    }

    clickHandler() {
        this.action();
    }

}

class Enemy extends GameObject {
    constructor(enemyName, animDict, x, y, width, height, health = 30, speed = 5, damage = 20, damageArea = 10) {
        super(x, y, width, height);
        this.initalizeAnimation(animDict);
        this.direction = directions.left;
        this.animation = this.animations.run;
        this.health = new Origin(health, health, 0, this.x, this.y + this.height + 5, this.width, 5);
        this.ai = new EnemyAI(this, false);
        this.damageArea = damageArea;
        this.speed = speed;
        this.damage = damage;
    }

    render() {
        this.ai.attack();
        this.health.render();
        this.animation.render(this.x, this.y, this.width, this.height, this.direction);
    }

    getPain(damage) {
        if (!this.health.isEnough(damage)) {
            this.ai.death = true;
            this.die();
        }
        this.health.reduce(damage);
    }

    attack() {
        if (this.animations.hasOwnProperty('attack')) {
            this.animation = this.animations.attack;
            this.animation.onend(() => player.getPain(this.damage));
        } else {
            setTimeout(() => player.getPain(this.damage), 2000);
        }
    }

    die() {
        if (this.animations.hasOwnProperty('die')) {
            this.animation = this.animations.die;
        }
        game.increaseScore();
        this.ai.death = true;
        setTimeout(() => {
            gameF.removeChild(this.health.frameRelationObject);
            game.removeObject(this);
        }, 1500);
    }

    move(dx) {
        this.animation = this.animations.run;
        this.health.move(dx);
        super.move(dx);
    }

    initalizeAnimation(animDict) {
        for (key in animDict) {
            this.animations[animDict[key][0]] = new AnimatedSprite(key, animDict[key][1]);
        }
    }

    ressurect(x) {
        this.health.increase(100);
        this.ai.death = false;
        this.move(x);
    }
}


class EnemyAI {
    constructor(enemy, death) {
        this.enemy = enemy;
        this.death = death;
    }

    getSideOfPlayer() {
        var enemy_center = this.enemy.x + this.enemy.width / 2;
        var player_center = player.x + player.width / 2;
        if (player_center - 15 <= enemy_center) {
            return directions.left;
        } else {
            return directions.right;
        }
    }

    canDamage() {
        var direction = this.enemy.direction;
        var pl_rightside = player.x + player.width;
        var pl_leftside = player.x;
        var en_rightside = this.enemy.x + this.enemy.width;
        var en_leftside = this.enemy.x;
        var en_rightDamageArea = this.enemy.x + this.enemy.width + this.enemy.damageArea;
        var en_leftDamageArea = this.enemy.x - this.enemy.damageArea;
        if (direction == directions.left) {
            if (pl_rightside > en_leftDamageArea && pl_rightside < en_rightside) {
                return true;
            }
            return false;
        } else if (direction == directions.right) {
            if (en_rightDamageArea > pl_leftside && en_leftside < pl_leftside) {
                return true;
            }
            return false;
        }
    }

    attack() {
        if (this.death) {
            return;
        }
        if (this.canDamage()) {
            this.enemy.attack();

        } else {
            this.move();
        }
    }

    move() {
        this.enemy.direction = this.getSideOfPlayer();
        if (this.enemy.direction == directions.left) {
            this.enemy.move(-this.enemy.speed);
        } else {
            this.enemy.move(this.enemy.speed);
        }
    }
}

class EnemySpawner {
    constructor(count, who = []) {
        this.objects = [];
        this.timer = null;
        for (var i = 0; i < who.length; i++) {
            for (var j = 0; j < count / who.length; j++) {
                var enemy = who[i];
                var y = 60;
                var x = window.innerWidth + getRandomInt(10, 250);
                var size = enemy.size;
                var speed = enemy.speed;
                var damage = enemy.damage;
                var damageArea = enemy.damageArea;
                var hp = enemy.hp;
                this.objects.push(
                    new Enemy(enemy.name, AnimationPool.enemies[enemy.name], x, y, size[0], size[1], hp, speed, damage, damageArea)
                );
            }
        }
    }

    spawn(max = 3) {
        for (var i = 0; i < max; i++) {
            var enemy = arrayRandElement(this.objects);
            if (enemy == undefined) {
                return;
            }
            game.addObject(enemy);
            this.objects = this.objects.filter(item => item != enemy);
        }
    }

    addObject(obj) {
        var x = window.innerWidth + getRandomInt(10, 250);
        obj.ressurect(x);
        this.objects.push(obj);
    }

    start() {
        var timer = setInterval(() => {
            var count = getRandomInt(1, 3);
            this.spawn(count);
        }, 1200);
    }
    
    stop(){
        clearInterval(this.timer);
    }
}

class Player extends GameObject {

    constructor(x, y, animDict) {
        super(x, y);
        this.initalizeAnimation(animDict);
        this.animation = this.animations.waiting;
        this.speed = 5;
        this.direction = directions.right;
        this.width = 150;
        this.height = 200;
        this.isBlock = false;
        this.hailAvaliable = true;
        this.mana = new Origin(100, 100, 0.4, 20, 820, 150, 20, 'Mana');
        this.health = new Origin(100, 100, 0.16, 20, 850, 150, 20, 'Health');
        this.health.render(gameF);
        this.swordHail = new GameObject(0, 60, 540, 400);
        this.swordHail.frameRelationObject = document.createElement('img');
        this.swordHail.frameRelationObject.style.position = 'absolute';
        this.initalizeHail();
        this.damageArea = 40;
    }

    initalizeAnimation(animDict) {
        for (key in animDict) {
            this.animations[animDict[key][0]] = new AnimatedSprite(key, animDict[key][1]);
        }
    }

    initalizeHail() {
        this.swordHail.frameRelationObject.src = 'animation/attack1/frame (1).png';
        this.swordHail.frameRelationObject.src = 'animation/aoe1.gif';
    }

    //Вызывается при движении игрока. Меняет позицию игрока.
    move(event) {
        if (Game.stop) {
            return;
        }
        this.direction = event.keyCode;
        if (this.animation != this.animations.run) {
            this.animation = this.animations.run;
        }

        var dx = 0;
        if (this.direction == directions.right) {
            dx = this.speed;
        } else if (this.direction == directions.left) {
            dx = -this.speed;
        }
        super.move(dx);
        if (this.x >= window.innerWidth) {
            game.win();
        }
    }

    render() {
        this.mana.render(gameF);
        this.health.render(gameF);
        this.health.regenerate();
        this.mana.regenerate();
        return this.animation.render(this.x, this.y, this.width, this.height, this.direction, this.id);
    }

    stop() {
        if (Game.stop) {
            return;
        }
        this.animation = this.animations.waiting;
    }

    attack() {
        if (Game.stop) {
            return;
        }
        if (this.animation != this.animations.attack1) {
            this.animation = this.animations.attack1;
            this.animation.onend(() => this.waiting());
        }

        setTimeout(() => game.damageMobs(15, player.damageArea), 1000);
    }

    block() {
        if (Game.stop || !this.mana.isEnough(5)) {
            return;
        }
        if (this.animation != this.animations.block) {
            this.animation = this.animations.block;
            this.isBlock = true;
            this.mana.reduce(5);
            this.animation.onend(() => {
                this.waiting();
                this.isBlock = false;
            });
        }
    }

    waiting() {
        if (Game.stop) {
            return;
        }
        if (this.animation != this.animations.waiting) {
            this.animation = this.animations.waiting;
        }
    }

    hail() {
        if (Game.stop || !this.mana.isEnough(30) || !this.hailAvaliable) {
            return;
        }
        var distanse = this.direction == directions.right ? 100 : -320 - this.width;
        this.swordHail.x = this.x + distanse;
        this.swordHail.render(document.body);
        this.mana.reduce(30);
        this.hailAvaliable = false;

        setTimeout(() => player.hailAvaliable = true, 15000);
        setTimeout(() => game.damageMobs(100, 400), 1100);

        setTimeout(() => {
            this.swordHail.erase(document.body);
            this.initalizeHail();

        }, 3500);
    }

    die() {
        if (this.animation != this.animations.death) {
            this.animation = this.animations.death;
            Game.stop = true;
            this.animation.onend(() => game.lose());
        }
    }

    getPain(damage) {
        if (this.isBlock) {
            return;
        }
        if (!this.health.isEnough(damage)) {
            this.health.reduce(damage);
            this.die();
        } else {
            this.health.reduce(damage);
        }
    }
}

//Класс игры. Контролирует состояния игры(пауза, возобновленно и т.д.) и перерисовку игровых объектов.
class Game {
    static hasInstance = false;
    static stop = false;

    constructor() {
        if (Game.hasInstance) {
            throw "Нельзя создавать несколько объектов игры!";
        }
        //Объекты для отрисовки в canvas
        this.objects = [];
        this.timer = null;
        this.score;
        this.scoreElements = document.getElementsByName('score');
        Game.hasInstance = true;
        //        this.gameField = gameFiGeld;
    }

    //Добавляет объекты для отрисовки.
    addObject(obj) {
        this.objects.push(obj);
    }

    removeObject(obj) {
        enemySpawner.addObject(obj);
        this.objects = this.objects.filter(item => item !== obj);
    }

    increaseScore() {
        this.setScore(this.score+1);
    }

    setScore(score){
       this.score = score;
        this.scoreElements.forEach(i => i.innerText = this.score);
    }

    //Перерисовывает все игровые объекты на game
    render() {
        gameF.innerHTML = '';
        for (var i = 0; i < this.objects.length; i++) {
            this.objects[i].render();
        }
    }

    //Запускает игру
    start() {
        //Скрваем приветственное окно
        setNick();
        this.setScore(0);
        
        player.mana.increase(100);
        player.health.increase(100);
        startScreen.style.display = "none";
        player.animation = player.animations.waiting;
        player.score = 0;
        this.timer = setInterval(() => requestAnimationFrame(() => this.render()), 80);
        Game.stop = false;
        enemySpawner.start();
    }

    //Останавливает игру
    pause() {
        clearInterval(this.timer);
        Game.stop = true;
    }

    end() {
        enemySpawner.stop();
        this.pause();
        player.x = player_x;
        player.y = player_y;

        for (var i = 0; i < this.objects.length; i++) {
            if (this.objects[i] instanceof Enemy) {
                enemySpawner.addObject(this.objects[i]);
                this.objects = this.objects.filter(item => item != this.objects[i]);
            }
        }
    }

    win() {
        this.end();
        winScreen.style.display = 'block';
    }

    restart() {
        this.end();
        deathScreen.style.display = 'none';
        winScreen.style.display = 'none';
        startScreen.style.display = "block";
    }

    changeStatement() {
        if (Game.stop) {
            this.start();
            player.stop();
            pauseButton.innerText = 'Pause';
        } else {
            this.pause();
            pauseButton.innerText = 'Start';
        }
    }

    lose() {
        this.end();
        deathScreen.style.display = 'block';
    }

    damageMobs(damage, ditance = 100) {
        for (var i = 0; i < this.objects.length; i++) {
            var mob = this.objects[i];
            if (mob instanceof Enemy) {
                if (player.direction == directions.right) {
                    if (mob.x < player.x + player.width + ditance && mob.x > player.x) {
                        mob.getPain(damage);
                    }
                } else {
                    if (mob.x + mob.width > player.x - ditance && mob.x + mob.width < player.x + player.width) {
                        mob.getPain(damage);
                    }
                }
            } else {
                continue;
            }
        }
    }
}

var AnimationPool = {
    'player': {
        'attack1': ['attack1', 21],
        'attack2': ['attack2', 26],
        'block': ['block', 23],
        'death': ['death', 49],
        'run': ['run', 17],
        'sprint': ['sprint', 14],
        'waiting': ['waiting', 18],
        'walk': ['walk', 25],
    },

    'enemies': {
        'dog': {
            'enemies/dog/run': ['run', 8],
        },
        'elf': {
            'enemies/elf/run': ['run', 20],
            'enemies/elf/wait': ['wait', 20],
            'enemies/elf/die': ['die', 20],
            'enemies/elf/attack2': ['attack', 20],
        },
        'greench': {
            'enemies/greench/run': ['run', 20],
            'enemies/greench/attack2': ['attack', 20],
            'enemies/greench/die': ['die', 20],
        },
    }
}

//var background = new StaticSprite('bg-game.png', 0, 0);
var game = new Game();
var player_x = 0;
var player_y = 60;
var player = new Player(player_x, player_y, AnimationPool.player);
game.addObject(player);

var startButton = document.getElementById('startButton');
var startScreen = document.getElementById('startScreen');
document.addEventListener('keydown', (event) => player.move(event));
document.addEventListener('keyup', (event) => player.stop());

var enemySize = [];
enemySize[0] = {
    'name': 'dog',
    'size': [100, 50],
    'damage': 2,
    'hp': 15,
    'speed': 5,
    'damageArea': 5
}

enemySize[1] = {
    'name': 'elf',
    'size': [170, 200],
    'damage': 5,
    'hp': 30,
    'speed': 3,
    'damageArea': 12
}

enemySize[2] = {
    'name': 'greench',
    'size': [170, 200],
    'damage': 10,
    'hp': 60,
    'speed': 3,
    'damageArea': 12
}
var enemySpawner = new EnemySpawner(9, enemySize);


var skills = {
    'shield': new Skill('skill-shield.png', () => player.block()),
    'sword': new Skill('skill-sword.png', () => player.attack()),
    'sword3': new Skill('skill-sword-3.png'),
    'shield8': new Skill('skill-sword-8.png', () => player.hail()),
}

for (var key in skills) {
    skills[key].render(skillPanel);
}

startButton.addEventListener('click', () => game.start());
pauseButton.addEventListener('click', () => game.changeStatement());
restartButtons.forEach(i => i.addEventListener('click', () => game.restart()))
