import Upgrade from "./Upgrade.js";

// Game play vars
var player;
var apples;
var monkey_right;
var bananas;
var cursors;
var score = 0;
var scoreText;
var excessApples = 0;
var excessAppleText;
var level = 1;

// Vars that change with each level
var applesNeeded = 8;
var appleSpawnInterval = 2000;
var appleGravityY = 0;
var monkeySpawnInterval = 30000;

// Upgrades
var speedUpgrade = new Upgrade("speed", 8, 0, 200, "assets/level_end/boots.PNG");
var luckUpgrade = new Upgrade("luck", 10, 0, 1, "assets/level_end/luck.PNG");
var basketUpgrade = new Upgrade("basket", 12, 0, 0, "assets/level_end/basket.PNG");

// Time-related vars
var gamePaused = false;
var timeSinceHitByBanana = 100;
var timelimit = 30;
var countdownText;
var timedEvent;
var appleIntervalID;
var monkeyIntervalID;
var timeouts = [];


function initializeGame() {
    score = 0;
    excessApples = 0;
    level = 1;
    applesNeeded = 8;
    appleSpawnInterval = 2000;
    appleGravityY = 0;
    monkeySpawnInterval = 30000;
    
    // Upgrades
    speedUpgrade = new Upgrade("speed", 8, 0, 200, "assets/level_end/boots.PNG");
    luckUpgrade = new Upgrade("luck", 10, 0, 1, "assets/level_end/luck.PNG");
    basketUpgrade = new Upgrade("basket", 12, 0, 0, "assets/level_end/basket.PNG");

    gamePaused = false;
}

/**
 * Updates certain variables based on current level and any upgrades.
 */
function setUpNextLevel() {
    score = excessApples;
    excessApples = 0;
    level++;

    applesNeeded = 4*level + 4;
    var numApplesToSpawn = getNumApplesToSpawn();
    appleSpawnInterval = 1000 * Phaser.Math.RoundTo(timelimit/numApplesToSpawn, -2);
    appleGravityY = Math.floor(5*(level-1));

    var numMonkeysToSpawn = Math.floor(level/2);
    monkeySpawnInterval = 1000 * Phaser.Math.RoundTo(timelimit/(numMonkeysToSpawn+1), -2);
    
    // console.log("Level: " + `${level}`
    // + "\nnumApplesToSpawn: " + `${numApplesToSpawn}`
    // + "\n appleSpawnInterval: " + `${appleSpawnInterval}`
    // + "\n appleGravity: " + `${appleGravityY}`
    // + "\n numMonkeysToSpawn: " + `${numMonkeysToSpawn}`
    // + "\n monkeySpawnInterval: " + `${monkeySpawnInterval}`);
}

/**
 * Determines number of apples to spawn based on current level.
 * @returns {Number} apples to spawn
 */
function getNumApplesToSpawn() {
    if (level > 10) {
        return Math.floor((0.4*level*level + Math.log(level) + 14) / (level/10));
    }
    return Math.floor(0.4*level*level + Math.log(level) + 14);
}

/**
 * The start screen for Apple Catch.
 * 
 * Allows player to begin the game or view the "How To Play" scene.
 */
class StartScreen extends Phaser.Scene {

    constructor () {
        super('StartScreen');
    }

    preload() {
        this.load.image('game-title', 'assets/start_screen/game_title.PNG');
        this.load.image('start-button', 'assets/start_screen/start_button.PNG');
        this.load.image('how-to-button', 'assets/start_screen/how_to_button.PNG');
        this.load.image('apple', 'assets/apple.PNG');
    }

    create() {
        var game_title = this.add.image(285, 219, 'game-title').setScale(3).setInteractive();
        var start_button = this.add.sprite(288, 425, 'start-button').setScale(3).setInteractive();
        var how_to_button = this.add.sprite(288, 625, 'how-to-button').setScale(3).setInteractive();

        // Spawn apples when Game Title is clicked
        var startScreenApples = this.physics.add.group();
        game_title.on('pointerdown', () => {
            startScreenApples.create(game.input.activePointer.x, game.input.activePointer.y, 'apple')
                            .setScale(3)
                            .setVelocityY(Phaser.Math.Between(-100,-350))
                            .setVelocityX(Phaser.Math.Between(-200,200))
                            .setGravityY(appleGravityY);
        });

        // Start Button Function        
        start_button.on('pointerdown', () => {
            this.scene.stop();
            initializeGame();
            this.scene.start('GamePlay');   
        });

        start_button.on('pointerover', function(pointer) {
            this.setScale(2.9);
        });

        start_button.on('pointerout', function (pointer) {
            this.setScale(3);
        });

        // How to Button Function
        how_to_button.on('pointerdown', () => {
            this.scene.stop();
            this.scene.start('HowToPlay');
        });

        how_to_button.on('pointerover', function(pointer) {
            this.setScale(2.9);
        });

        how_to_button.on('pointerout', function (pointer) {
            this.setScale(3);
        });
        
    }
}

/**
 * The How To Play screen for Apple Catch.
 */
class HowToPlay extends Phaser.Scene {

    constructor() {
        super('HowToPlay');
    }

    preload() {
        this.load.image('how-to-title', 'assets/start_screen/how_to_button.PNG');
        this.load.image('how-to-play', 'assets/start_screen/how_to_play.PNG');
        this.load.image('exit-button', 'assets/exit_button.PNG');
    }

    create() {
        this.add.image(288, 110, 'how-to-title').setScale(3);
        this.add.image(288, 450, 'how-to-play').setScale(5);
        var exit_button = this.add.image(80, 140, 'exit-button').setScale(3).setInteractive();

        var instructions =  
        "\n Grandma needs apples to make apple pies."
        +"\n How many can you catch?"
        +"\n\n Beware of mischevious critters who try to distract you...";
        this.make.text({
            x: 288, 
            y: 340, 
            text: instructions,
            origin: { x: 0.5, y: 0.5 },
            style: board_text_style
        });

        // Exit Button function
        exit_button.on('pointerdown', () => {
            this.scene.stop();
            if (gamePaused) {
                this.scene.start('PauseGame');
            }
            else {
                this.scene.start('StartScreen');
            } 
        });

        exit_button.on('pointerover', function(pointer) {
            this.setScale(2.5);
        });

        exit_button.on('pointerout', function (pointer) {
            this.setScale(3);
        });

    }

    update() {
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.stop();
            if (gamePaused) {
                this.scene.start('PauseGame');
            }
            else {
                this.scene.start('StartScreen');
            }
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.stop();
            if (gamePaused) {
                this.scene.start('PauseGame');
            }
            else {
                this.scene.start('StartScreen');
            }
        });
    }
    
}

class PauseGame extends Phaser.Scene {

    constructor () {
        super('PauseGame');
    }

    preload() {
        this.load.image('board', 'assets/blank_board.PNG');
        this.load.image('how-to-play-button', 'assets/start_screen/how_to_button.PNG');
        this.load.image('exit-to-main', 'assets/exit_to_main_button.PNG');
        this.load.image('exit', 'assets/exit_button.PNG');
    }

    create() {
        this.add.image(288, 400, 'board').setScale(4);
        var exit_button = this.add.image(90, 185, 'exit').setScale(3).setInteractive();
        var how_to_button = this.add.image(288, 315, 'how-to-play-button').setScale(3).setInteractive();
        var exit_to_main_button = this.add.image(288, 475, 'exit-to-main').setScale(3).setInteractive();


        // Exit Button function
        exit_button.on('pointerdown', () => {
            this.scene.stop();
            gamePaused = false;
            game.scene.resume('GamePlay');
        });

        exit_button.on('pointerover', function(pointer) {
            this.setScale(2.5);
        });

        exit_button.on('pointerout', function (pointer) {
            this.setScale(3);
        });


        // How to Button function
        how_to_button.on('pointerdown', () => {
            this.scene.stop();
            this.scene.moveAbove('GamePlay', 'HowToPlay');
            this.scene.start('HowToPlay');
        });

        how_to_button.on('pointerover', function(pointer) {
            this.setScale(2.9);
        });

        how_to_button.on('pointerout', function (pointer) {
            this.setScale(3);
        });


        // Exit To Main Button function
        exit_to_main_button.on('pointerdown', () => {
            this.scene.stop();
            this.scene.stop('GamePlay');
            gamePaused = false;
            stopTimer();
            this.scene.start('StartScreen');
        });

        exit_to_main_button.on('pointerover', function(pointer) {
            this.setScale(2.9);
        });

        exit_to_main_button.on('pointerout', function (pointer) {
            this.setScale(3);
        });
    }

    update() {
        this.input.keyboard.on('keydown-ESC', () => {
            gamePaused = false;
        });
        if (!gamePaused) {
            this.scene.stop();
            game.scene.resume('GamePlay');
        }
    }
}

/**
 * A scene which is prompted at the end of each level.
 * 
 * Allows player to choose upgrades and proceed to the next level.
 */
class LevelEnd extends Phaser.Scene {

    constructor () {
        super('LevelEnd');
        this.counter = 0;
    }

    preload() {
        this.load.image('level-end-board', 'assets/level_end/level_end_board.PNG');
        this.load.image('boots', speedUpgrade.sprite);
        this.load.image('luck', luckUpgrade.sprite);
        this.load.image('basket', basketUpgrade.sprite);
        this.load.image('next', 'assets/level_end/next_level_button.PNG');
        this.load.image('apple', 'assets/apple.PNG');
    }

    create() {
        this.add.image(288, 400, 'level-end-board').setScale(5.5);
        speedUpgrade.icon = this.add.image(140, 500, 'boots').setScale(4).setInteractive();
        luckUpgrade.icon = this.add.image(290, 500, 'luck').setScale(4).setInteractive();
        basketUpgrade.icon = this.add.image(440, 500, 'basket').setScale(4).setInteractive();
        var next_button = this.add.image(375, 685, 'next').setScale(3.5).setInteractive();

        // End of level stats
        excessApples = score > applesNeeded ? score - applesNeeded : 0;

        var grade = "Nice!";
        if (excessApples > 5) {
            grade = "Amazing!";
        }
        else if (score < applesNeeded) {
            grade = "Too bad...";
        }
        var levelEndText = grade
        + "\n\nApples needed: " + applesNeeded
        + "\nApples caught: " + score
        + "\nExcess apples: " + excessApples;
        this.add.text(80, 150, levelEndText, level_end_text_style);

        // Speed price
        speedUpgrade.priceText = this.add.text(110, 605, speedUpgrade.price, level_end_text_style);
        this.add.image(160, 617, 'apple').setScale(2);

        // Luck price
        luckUpgrade.priceText = this.add.text(260, 605, luckUpgrade.price, level_end_text_style);
        this.add.image(310, 617, 'apple').setScale(2);

        // Basket price
        basketUpgrade.priceText = this.add.text(410, 605, basketUpgrade.price, level_end_text_style);
        this.add.image(460, 617, 'apple').setScale(2);

        // Spending (excess) apples
        this.add.image(125, 675, 'apple').setScale(3);
        excessAppleText = this.add.text(150, 668, excessApples, level_end_text_style);

        // Upgrade Button functions
        // Purchased upgrades update their respective variables
        var upgrades = [speedUpgrade, luckUpgrade, basketUpgrade];
        for (const currUpgrade of upgrades) {
            if (excessApples < currUpgrade.price) {
                currUpgrade.priceText.setColor("#a00");
            }
            else {
                currUpgrade.icon.on('pointerdown', function (pointer) {
                    excessApples = excessApples - currUpgrade.price;
                    currUpgrade.applyUpgradeToGame();
                    currUpgrade.price = currUpgrade.price + 8;
                    currUpgrade.priceText.setText(currUpgrade.price);
                });
        
                currUpgrade.icon.on('pointerover', function(pointer) {
                    this.setScale(4.5);
                });
        
                currUpgrade.icon.on('pointerout', function (pointer) {
                    this.setScale(4);
                });
            }
        }

        // Next Level Button function
        next_button.on('pointerdown', () => {
           setUpNextLevel();
           this.scene.stop();
           this.scene.start('GamePlay');
        });

        next_button.on('pointerover', function(pointer) {
            this.setScale(3);
        });

        next_button.on('pointerout', function (pointer) {
            this.setScale(3.5);
        });
        
        this.counter = 0;
    }

    update() {
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.counter == 0) {
                this.counter++;
                this.scene.stop();
                setUpNextLevel();
                this.scene.start('GamePlay');
            }
        });

        if (excessApples < speedUpgrade.price) {
            speedUpgrade.priceText.setColor("#a00");
            speedUpgrade.icon.setScale(4).disableInteractive();
        }
        if (excessApples < luckUpgrade.price) {
            luckUpgrade.priceText.setColor("#a00");
            luckUpgrade.icon.setScale(4).disableInteractive();
        }
        if (excessApples < basketUpgrade.price) {
            basketUpgrade.priceText.setColor("#a00");
            basketUpgrade.icon.setScale(4).disableInteractive();
        }
        excessAppleText.setText(excessApples);
    }
}


class GamePlay extends Phaser.Scene {

    constructor () {
        super('GamePlay');
    }

     preload() {
        this.load.image('apple', 'assets/apple.PNG');
        this.load.image('mush', 'assets/mush.PNG');
        this.load.image('golden-apple', 'assets/golden_apple.PNG');
        this.load.image('golden-mush', 'assets/golden_mush.PNG');
        this.load.image('banana', 'assets/banana.PNG');
        this.load.image('tree', 'assets/tree.PNG');
        this.load.image('tiles', 'assets/ground_tileset.png');
        this.load.tilemapTiledJSON('ground', 'assets/ground.json');
        this.load.spritesheet('playerB0', 'assets/player/playerB0.png', { frameWidth: 16 + 16*basketUpgrade.degree, frameHeight: 32});
        this.load.spritesheet('playerB1', 'assets/player/playerB1.png', { frameWidth: 32, frameHeight: 32});
        this.load.spritesheet('monkey', 'assets/monkey.png', { frameWidth: 96, frameHeight: 96});
    }

     create() { 

        // Scoring & Level
        scoreText = this.add.text(16, 16, 'SCORE: ' + score + '/' + applesNeeded, colorful_text_style);
        this.add.text(16, 45, 'Level ' + level, colorful_text_style);

        // Time
        gamePaused = false;
        this.initialTime = timelimit;
        countdownText = this.add.text(325, 16, 
            'TIME LEFT: ' + formatTime(this.initialTime),
            colorful_text_style
        );
        timedEvent = this.time.addEvent({ delay: 1000, callback: onEvent, callbackScope: this, loop: true });


        // Trees
        this.add.image(100, 575, 'tree').setScale(3).alpha = 0.4;
        this.add.image(475, 575, 'tree').setScale(3).alpha = 0.4;
        var main_tree = this.add.image(288, 400, 'tree').setScale(7.5);


        // Create ground
        const map = this.make.tilemap({ key: 'ground' });
        const tiles = map.addTilesetImage('apple catch', 'tiles');
        const layer = map.createLayer(0, tiles, 0, 0);
        layer.setScale(4);
        

        // Player creation & animations
        var playerSprite = 'playerB' + basketUpgrade.degree;
        player = this.physics.add.sprite(288, 500, playerSprite);
        player.setCollideWorldBounds(true);
        player.setBounce(0.2);
        player.setScale(4);
        player.body.setGravityY(1000);

        if (!this.anims.exists('left')) {
            
            this.anims.create({
                key: 'left',
                frames: this.anims.generateFrameNumbers(playerSprite, { start: 0, end: 2}),
                frameRate: 10,
                repeat: -1
            });
    
            this.anims.create({
                key: 'still',
                frames: [ { key: playerSprite, frame: 2 } ],
                frameRate: 20
            });
    
            this.anims.create({
                key: 'right',
                frames: this.anims.generateFrameNumbers(playerSprite, { start: 2, end: 4}),
                frameRate: 10,
                repeat: -1
            });
    
            this.anims.create({
                key: 'shock',
                frames: [ { key: playerSprite, frame: 5 }],
                frameRate: 1
            });
        }   // if basket purchase has been made
        else if (this.anims.anims.entries.left.frames[0].textureKey != playerSprite) {
            
            this.anims.remove('left');
            this.anims.remove('still');
            this.anims.remove('right');
            this.anims.remove('shock');

            this.anims.create({
                key: 'left',
                frames: this.anims.generateFrameNumbers(playerSprite, { start: 0, end: 2}),
                frameRate: 10,
                repeat: -1
            });
    
            this.anims.create({
                key: 'still',
                frames: [ { key: playerSprite, frame: 2 } ],
                frameRate: 20
            });
    
            this.anims.create({
                key: 'right',
                frames: this.anims.generateFrameNumbers(playerSprite, { start: 2, end: 4}),
                frameRate: 10,
                repeat: -1
            });
    
            this.anims.create({
                key: 'shock',
                frames: [ { key: playerSprite, frame: 5 }],
                frameRate: 1
            });
        }



        // Monkeys
        bananas = this.physics.add.group();
        monkey_right = this.physics.add.staticSprite(335, 340, 'monkey').setScale(4);
        monkey_right.visible = false;

        if (!this.anims.exists('appear')) {
            this.anims.create({
                key: 'appear',
                frames: this.anims.generateFrameNumbers('monkey', { start: 0, end: 1 }),
                frameRate: 10
            });
    
            this.anims.create({
                key: 'toss',
                frames: this.anims.generateFrameNumbers('monkey', { start: 1, end: 3}),
                frameRate: 8
            });
    
            this.anims.create({
                key: 'idle',
                frames: [ { key: 'monkey', frame: 1 }],
                frameRate: 20
            });
    
            this.anims.create({
                key: 'giggle',
                frames: this.anims.generateFrameNumbers('monkey', { start: 5, end: 6 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Spawn monkey
        monkeyIntervalID = setInterval( () => {
            spawnMonkey(this);
        }, monkeySpawnInterval);


        // Apples
        apples = this.physics.add.group();
        appleIntervalID = setInterval(spawnApple, appleSpawnInterval);
        

        // Set colliders
        layer.setCollisionByExclusion([-1]);
        this.physics.add.collider(player, layer);
        this.physics.add.collider(apples, layer);

        // Check collisions
        this.physics.add.overlap(player, apples, processAppleCollision, null, this);
        this.physics.add.overlap(player, bananas, bananaStrike, null, this);

        // Controls
        cursors = this.input.keyboard.createCursorKeys();

    }


     update() {
        
        // Time
        if (this.initialTime === 0) {
            stopTimer();
            this.scene.pause();
            game.scene.start('LevelEnd');
        }

        // Pause Game
        this.input.keyboard.on('keydown-ESC', () => {
            gamePaused = true;
        });
        if (gamePaused) {
            this.scene.pause();
            this.scene.launch('PauseGame');
        }
 
        // Player movement
        if (timeSinceHitByBanana < 50) {
            timeSinceHitByBanana++;
            player.anims.play('shock');
        }
        else {
            // Applied when player walks over mushed apple
            var speedPenalty = 1;
            if (this.physics.overlap(player, apples)) {
                speedPenalty = 0.7;
            }
            if (cursors.left.isDown) {
                player.setVelocityX(-speedUpgrade.effect * speedPenalty);
                player.anims.play('left', true);
            }
            else if (cursors.right.isDown) {
                player.setVelocityX(speedUpgrade.effect * speedPenalty);
                player.anims.play('right', true);
            }
            else {
                player.setVelocityX(0);
                player.anims.play('still');
            }

            if (cursors.up.isDown && player.body.blocked.down) {
                player.setVelocityY(-600);
            }

            if (cursors.down.isDown) {
                player.setVelocityY(400);
            }            
        }

    }
}


function spawnApple() {
    if (!gamePaused) {
        var xCoord = Phaser.Math.Between(125, 475);
        var yCoord = Phaser.Math.Between(100, 400);
        var randomRoll = Phaser.Math.Between(0, 100);
    
        var apple;
        if (randomRoll < (3 * luckUpgrade.effect)) {
            
            // Spawn Golden Apple
            apple = apples.create(xCoord, yCoord, 'golden-apple').setScale(3);
            apple.name = "golden";
        }
        else {
            apple = apples.create(xCoord, yCoord, 'apple').setScale(3);
        }
        apple.setBounce(0.1);
        apple.setVelocityY(Phaser.Math.Between(-50, 0));
        apple.setGravityY(appleGravityY);
        apple.setCollideWorldBounds(true);
    }
}

function spawnMonkey(scene) {
    if (!gamePaused) {
        monkey_right.visible = true;
        animateMonkey(scene, monkey_right);
    }
}


function animateMonkey(scene, monkey) {
    monkey.anims.play('appear');
    var bananaInterval = Phaser.Math.Between(1000,4000);
    timeouts.push(setTimeout( () => {
        monkey.anims.play('toss').once('animationcomplete', () => {
            tossBanana(scene, monkey);
        }); 
    }, bananaInterval));

    timeouts.push(setTimeout( () => {
        monkey.anims.play('giggle');
    }, bananaInterval + 1000));

    timeouts.push(setTimeout( () => {
        monkey.anims.playReverse('appear').once('animationcomplete', () => {
            monkey.visible = false;
        });
    }, bananaInterval + 2500));
    
}

function tossBanana(scene, monkey) {
    var banana = bananas.create(375, 200, 'banana').setScale(3);
    banana.setVelocityX(player.x - banana.x);
    banana.setVelocityY(player.y - banana.y - 50);
}

function bananaStrike() {
    timeSinceHitByBanana = 0;
    player.setVelocityX(-1*player.body.velocity.x);
    player.setVelocityY(-1*player.y);
}

function processAppleCollision(player, apple) {
    if (player.body.touching.up && !apple.body.blocked.down) {
        collectApple(player, apple);
    }
    else if (apple.name != 'mush') {
        turnAppleToMush(apple);        
    }
}

function collectApple(player, apple) {
    apple.disableBody(true, true);
    if (apple.name == "golden") {
        score = score + 4;
    }
    score++;
    scoreText.setText('SCORE: ' + score + '/' + applesNeeded);

}

function turnAppleToMush(apple) {
    if (apple.name != "mush") {
        if (apple.name == "golden") {
            apple.setTexture('golden-mush');
        }
        else {
            apple.setTexture('mush'); 
        }
        apple.name = "mush";
    }
}

function formatTime(seconds) {
    // Minutes
    var minutes = Math.floor(seconds/60);
    // Seconds
    var partInSeconds = seconds%60;
    // Adds left zeroes to seconds
    partInSeconds = partInSeconds.toString().padStart(2, '0');

    return `${minutes}:${partInSeconds}`;
}

function stopTimer() {
    timedEvent.paused = true;
    clearInterval(appleIntervalID);
    clearInterval(monkeyIntervalID);
    for (var i=0; i <timeouts.length; i++) {
        clearTimeout(timeouts[i]);
    }
}


function onEvent() {
    this.initialTime--;
    countdownText.setText('TIME LEFT: ' + formatTime(this.initialTime));
}




// Text styles
var colorful_text_style = {
    fontFamily: '"Pixelify Sans", sans-serif',
    fontSize: '32px',
    fill: '#fe3',
    stroke: '#f54',
    strokeThickness: 3,
    shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#f0e',
        blur: 5,
        fill: true
    }
};

var board_text_style = {
    fontFamily: '"Pixelify Sans", sans-serif',
    fontSize: '30px',
    fill: '#4a1c1a',
    stroke: '#c17f38',
    strokeThickness: 3,
    align: 'center',
    wordWrap: { width: 375 }
};

var level_end_text_style = {
    fontFamily: '"Pixelify Sans", sans-serif',
    fontSize: '30px',
    fill: '#4a1c1a',
    stroke: '#c17f38',
    strokeThickness: 3,
    align: 'left',
    wordWrap: { width: 375 }
}

// Game configuration
var config = {
    type: Phaser.AUTO,
    width: 576,
    height: 832,
    backgroundColor: '#48C4F8',
    render: {
        antialias: false
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [StartScreen, HowToPlay, GamePlay, LevelEnd, PauseGame]
};

var game = new Phaser.Game(config);