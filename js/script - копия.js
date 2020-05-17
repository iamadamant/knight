var gameF = document.getElementById('game');
var skillPanel = document.getElementById('skillPanel');
gameF.style.width = px(window.innerWidth);
gameF.style.height = px(window.innerHeight);


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

function print(text) {
    console.log(text);
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
        this.isDynamic = false;
    }

    render(gameField = gameF) {
        this.frameRelationObject.style.bottom = px(this.y);
        this.frameRelationObject.style.left = px(this.x);
        this.frameRelationObject.style.width = px(this.width);
        this.frameRelationObject.style.height = px(this.height);
        this.frameRelationObject = gameField.appendChild(this.frameRelationObject);
    }

    erase() {
        gameF.removeChild(this.frameRelationObject);
    }
}


//Анимированный спрайт(с анимацией)
class AnimatedSprite extends GameObject {

    constructor(name, frameCount) {
        super();
        this.name = name;
        this.frame = 0;
        this.images = [];
        //Сколько кадров в анимации
        this.frameCount = frameCount;
        this.fetchFrames();
        this.isDynamic = true;
        this.onendFunction = () => null;
        this.framePointer = {}
    }
    
    bind(id){
        this.framePointer[id] = 0;
    }

    hide() {
        var prev = this.frame - 1;
        if (this.frame - 1 < 0) {
            var prev = this.frameCount - 2;
        }
        this.images[prev].style.display = 'none';
    }

    //При вызове меняет ключевой кадр
    render(x, y, width, height, direction) {
        this.hide();
        if (direction == directions.left) {
            this.images[this.frame].style.transform = 'scale(-1, 1)';
        } else {
            this.images[this.frame].style.transform = 'scale(1, 1)';
        }
        this.images[this.frame].style.display = 'block';
        this.images[this.frame].style.left = px(x);
        this.images[this.frame].style.bottom = px(y);
        this.images[this.frame].style.width = px(width);
        this.images[this.frame].style.height = px(height);
        this.frame += 1;
        if (this.frame == this.frameCount - 1) {
            this.frame = 0;
            this.end();
        }
    }

    //Загружает все изображения в массив
    fetchFrames() {
        for (var i = 1; i <= this.frameCount; i++) {
            var img = document.createElement('img');
            img.src = 'animation/' + this.name + '/frame (' + i + ').png';
            img.style.display = 'none';
            img.style.position = 'absolute';
            this.images.push(gameF.appendChild(img));
        }

    }

    onend(oef) {
        this.onendFunction = oef;
    }

    end() {
        this.onendFunction();
        this.onendFunction = () => null;
    }
}

class Origin extends GameObject {
    constructor(max, value, regeneration, x, y, width = 150, height = 20) {
        super(x, y, width, height);
        this.value = value;
        this.max = max;
        this.regeneration = regeneration;
        this.frameRelationObject = document.createElement('progress');
        this.frameRelationObject.style.position = 'fixed';
        this.frameRelationObject.max = max;
        this.frameRelationObject.value = value;
    }

    regenerate() {
        this.value += this.regeneration;
        if (this.value > this.max) {
            this.value = this.max;

        }
        this.frameRelationObject.value = this.value;
    }

    reduce(count) {
        if (this.value - count < 0) {
            return false;
        }
        this.value -= count;
        this.frameRelationObject.value = this.value;
        return true;

    }

    isEnded() {
        if (this.value <= 0) {
            return true;
        }
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
    constructor(enemyName, animations, x, y, width, height) {
        super(x, y, width, height);
        this.animations = animations;
        this.direction = directions.left;
        this.animation = this.animations.run;
        this.health = new Origin(30, 30, 0, this.x, this.y + this.height + 5, this.width, 5);
    }

    render() {
        this.health.render();
        this.animation.render(this.x, this.y, this.width, this.height, this.direction);
    }

    getPain(damage) {
        this.health.reduce(damage);
        if (this.health.isEnded()) {
            this.die();
        }
    }

    die() {
        this.animation.hide();
        this.animation = this.animations.die;
        setTimeout(() => {
            gameF.removeChild(this.health.frameRelationObject);
            this.animation.hide();
            game.removeObject(this);
        }, 1500);
    }
}


class Player extends GameObject {

    constructor(x, y, animations) {
        super(x, y);
        this.animations = animations;
        this.animation = this.animations.waiting;
        this.speed = 5;
        this.direction = directions.right;
        this.width = 150;
        this.height = 200;
        this.mana = new Origin(100, 75, 0.15, 20, 820);
        this.mana.render(gameF);
        this.health = new Origin(100, 75, 0.06, 20, 850);
        this.health.render(gameF);
        this.swordHail = new GameObject(0, this.y - this.height, 540, 400);
        this.swordHail.frameRelationObject = document.createElement('img');
        this.swordHail.frameRelationObject.style.position = 'absolute';
        this.initalizeHail();
        this.damageArea = 40;
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
            print('hide')
            this.animation.hide();
            this.animation = this.animations.run;
        }

        var dx = 0;
        if (this.direction == directions.right) {
            dx = this.speed;
        } else if (this.direction == directions.left) {
            dx = -this.speed;
        }
        this.x += dx;
    }

    render() {
        this.health.regenerate();
        this.mana.regenerate();
        return this.animation.render(this.x, this.y, this.width, this.height, this.direction);
    }

    stop() {
        if (Game.stop) {
            return;
        }
        this.animation.hide();
        this.animation = this.animations.waiting;
    }

    attack() {
        if (Game.stop) {
            return;
        }
        if (this.animation != this.animations.attack1) {
            if (!this.mana.reduce(9)) {
                return
            }
            this.animation.hide();
            this.animation = this.animations.attack1;
            this.animation.onend(() => this.waiting());
        }

        setTimeout(() => game.damageMobs(), 1000);
    }

    block() {
        if (Game.stop) {
            return;
        }
        if (this.animation != this.animations.block) {
            if (!this.mana.reduce(11)) {
                return
            }
            this.animation.hide();
            this.animation = this.animations.block;
            this.animation.onend(() => this.waiting());
        }
    }

    waiting() {
        if (Game.stop) {
            return;
        }
        if (this.animation != this.animations.waiting) {
            this.animation.hide();
            this.animation = this.animations.waiting;
        }
    }

    hail() {
        if (Game.stop) {
            return;
        }
        if (!this.mana.reduce(30)) {
            return
        }
        var distanse = this.direction == directions.right ? 100 : -320 - this.width;
        this.swordHail.x = this.x + distanse;
        this.swordHail.render();

        setTimeout(() => {
            this.swordHail.erase();
            this.initalizeHail();
        }, 3500);
    }

    die() {
        if (this.animation != this.animations.death) {
            this.animation.hide();
            this.animation = this.animations.death;
            setTimeout(() => this.animation.hide(), 300);
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
        Game.hasInstance = true;
        //        this.gameField = gameFiGeld;
    }

    //Добавляет объекты для отрисовки.
    addObject(obj) {
        this.objects.push(obj);
    }

    removeObject(obj) {
        this.objects = this.objects.filter(item => item !== obj);
    }

    //Перерисовывает все игровые объекты на game
    render() {
        for (var i = 0; i < this.objects.length; i++) {
            this.objects[i].render();
        }
    }

    //Запускает игру
    start() {
        //Скрваем приветственное окно
        startScreen.style.display = "none";
        this.timer = setInterval(() => requestAnimationFrame(() => this.render()), 80);
        Game.stop = false;
    }

    //Останавливает игру
    end() {
        clearInterval(this.timer);
        Game.stop = true;
    }

    changeStatement() {
        if (Game.stop) {
            this.start();
            player.stop();
            pauseButton.innerText = 'Pause';
        } else {
            this.end();
            pauseButton.innerText = 'Start';
        }
    }

    damageMobs() {
        print('damage');
        for (var i = 0; i < this.objects.length; i++) {
            var mob = this.objects[i];
            if (mob instanceof Enemy) {
                if (player.direction == directions.right) {
                    if (mob.x < player.x + player.width + player.damageArea && mob.x > player.x) {
                        mob.getPain(15);
                    }
                } else {
                    if (mob.x + mob.width > player.x - player.damageArea && mob.x + mob.width < player.x + player.width) {
                        mob.getPain(15);
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
        'attack1': new AnimatedSprite('attack1', 21),
        'attack2': new AnimatedSprite('attack2', 26),
        'block': new AnimatedSprite('block', 23),
        'death': new AnimatedSprite('death', 49),
        'run': new AnimatedSprite('run', 17),
        'sprint': new AnimatedSprite('sprint', 14),
        'waiting': new AnimatedSprite('waiting', 18),
        'walk': new AnimatedSprite('walk', 25),
    },
    
    'enemies': {
        'dog': {
            'run': new AnimatedSprite('enemies/dog/run', 8),
        },
        'elf': {
            'run': new AnimatedSprite('enemies/elf/run', 20),
            'wait': new AnimatedSprite('enemies/elf/wait', 20),
            'die': new AnimatedSprite('enemies/elf/die', 20),
            'attack': new AnimatedSprite('enemies/elf/attack2', 20),
        },
        'greench': {
            'run': new AnimatedSprite('enemies/greench/run', 20),
            'attack': new AnimatedSprite('enemies/greench/attack2', 20),
            'die': new AnimatedSprite('enemies/greench/die', 20),
        },
    }
}

//Виды анимации. 
var animation = {
    'attack1': new AnimatedSprite('attack1', 21),
    'attack2': new AnimatedSprite('attack2', 26),
    'block': new AnimatedSprite('block', 23),
    'death': new AnimatedSprite('death', 49),
    'run': new AnimatedSprite('run', 17),
    'sprint': new AnimatedSprite('sprint', 14),
    'waiting': new AnimatedSprite('waiting', 18),
    'walk': new AnimatedSprite('walk', 25),
}

//var background = new StaticSprite('bg-game.png', 0, 0);
var game = new Game();
var player = new Player(0, 60, AnimationPool.player);
game.addObject(player);

var startButton = document.getElementById('startButton');
var startScreen = document.getElementById('startScreen');
document.addEventListener('keydown', (event) => player.move(event));
document.addEventListener('keyup', (event) => player.stop());

var dog = new Enemy('dog', AnimationPool.enemies.dog, 600, 60, 100, 50);
game.addObject(dog);

var elf = new Enemy('elf', AnimationPool.enemies.elf, 700, 60, 170, 200);
game.addObject(elf);

var greench = new Enemy('greench', AnimationPool.enemies.greench, 900, 60, 170, 200);
game.addObject(greench);

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
