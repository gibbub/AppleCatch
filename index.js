import Upgrade from "./Upgrade.js";

// Mobile Play
var mobilePlayOn = false;
var jump_button;
var left_button;
var right_button;

// Game play vars
var player;
var apples;
var monkey_right;
var monkey_left;
var bananas;
var cursors;
var score = 0;
var scoreText;
var excessApples = 0;
var excessAppleText;
var stats;
var gameplayMusic;

// Vars that change with each level
var level = 1;
var applesNeeded = 8;
var appleSpawnInterval = 2000;
var appleGravityY = 0;
var monkeySpawnInterval = 30000;

// Upgrades
var speedUpgrade;
var luckUpgrade;
var basketUpgrade;

// Time-related vars
var gamePaused = false;
var timeSinceHitByBanana = 100;
var timelimit = 30;
var countdownText;
var timedEvent;
var appleIntervalID;
var monkeyIntervalID;
var timeouts = [];

/**
 * Sets up first level; all game vars are set to their defaults
 */
function initializeGame() {
    score = 0;
    excessApples = 0;
    level = 1;
    applesNeeded = 8;
    appleSpawnInterval = 2000;
    appleGravityY = 0;
    monkeySpawnInterval = 30000;

    stats = {
        totalApples: 0,
        goldenApples: 0,
        upgradesPurchased: 0,
        bananaHits: 0
    };
    
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
    applesNeeded = 2*(level-1) + 8;

    var numApplesToSpawn = Math.floor(2*(level-1) + 12 - (2*Math.floor(level/5)));
    appleSpawnInterval = 1000 * Phaser.Math.RoundTo(timelimit/numApplesToSpawn, -2);
    appleGravityY = Math.floor(5*(level-1));

    var numMonkeysToSpawn = Math.floor(level/2);
    monkeySpawnInterval = 1000 * Phaser.Math.RoundTo(timelimit/(numMonkeysToSpawn+1), -2);
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
        this.load.spritesheet('mobile-play-toggle', 'assets/mobile_play/mobile_play_options.png', { frameWidth: 64, frameHeight: 16 });
        this.load.image('apple', 'assets/apple.PNG');
    }

    create() {
        var game_title = this.add.image(285, 219, 'game-title').setScale(3).setInteractive();
        var start_button = this.add.sprite(288, 425, 'start-button').setScale(3).setInteractive();
        var how_to_button = this.add.sprite(288, 625, 'how-to-button').setScale(3).setInteractive();
        var mobile_play_toggle = this.add.sprite(288, 750, 'mobile-play-toggle').setScale(3).setInteractive();

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
            playSound("game_start");
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
            playSound("select");
            this.scene.stop();
            this.scene.start('HowToPlay');
        });

        how_to_button.on('pointerover', function(pointer) {
            this.setScale(2.9);
        });

        how_to_button.on('pointerout', function (pointer) {
            this.setScale(3);
        });

        // Mobile Play Toggle
        this.anims.create({
            key: 'mobile-play-off',
            frames: [ { key: 'mobile-play-toggle', frame: 0 }],
            frameRate: 1
        });
        this.anims.create({
            key: 'mobile-play-on',
            frames: [ { key: 'mobile-play-toggle', frame: 1}],
            frameRate: 1
        })
        mobile_play_toggle.on('pointerdown', () => {
            if (mobilePlayOn) {
                playSound("exit");
                mobilePlayOn = false;
                mobile_play_toggle.anims.play('mobile-play-off');
            }
            else {
                playSound("select");
                mobilePlayOn = true;
                mobile_play_toggle.anims.play('mobile-play-on');
            }
        });

        if (mobilePlayOn) {
            mobile_play_toggle.anims.play('mobile-play-on');
        }
        
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
            playSound("exit");
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
        this.load.spritesheet('mobile-play-toggle', 'assets/mobile_play/mobile_play_options.png', { frameWidth: 64, frameHeight: 16 });
    }

    create() {
        this.add.image(288, 400, 'board').setScale(4);
        var exit_button = this.add.image(90, 185, 'exit').setScale(3).setInteractive();
        var how_to_button = this.add.image(288, 315, 'how-to-play-button').setScale(3).setInteractive();
        var exit_to_main_button = this.add.image(288, 475, 'exit-to-main').setScale(3).setInteractive();
        var mobile_play_toggle = this.add.sprite(288, 625, 'mobile-play-toggle').setScale(3).setInteractive();

        // Exit Button function
        exit_button.on('pointerdown', () => {
            playSound("exit");
            this.scene.stop();
            gamePaused = false;
            game.scene.resume('GamePlay');
            gameplayMusic.play();
        });

        exit_button.on('pointerover', function(pointer) {
            this.setScale(2.5);
        });

        exit_button.on('pointerout', function (pointer) {
            this.setScale(3);
        });


        // How to Button function
        how_to_button.on('pointerdown', () => {
            playSound("select");
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
            playSound("select");
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

        // Mobile Play Toggle
        mobile_play_toggle.on('pointerdown', () => {
            if (mobilePlayOn) {
                playSound("exit");
                mobilePlayOn = false;
                mobile_play_toggle.anims.play('mobile-play-off');
            }
            else {
                playSound("select");
                mobilePlayOn = true;
                mobile_play_toggle.anims.play('mobile-play-on');
            }
        });

        if (mobilePlayOn) {
            mobile_play_toggle.anims.play('mobile-play-on');
        }
    }

    update() {
        this.input.keyboard.on('keydown-ESC', () => {
            gamePaused = false;
            gameplayMusic.play();
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
        this.load.spritesheet('amazing-text', 'assets/level_end/amazing_text.png', { frameWidth: 65, frameHeight: 36 });
        this.load.spritesheet('grandma-dance', 'assets/level_end/grandma_dance.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('nice-text', 'assets/level_end/nice_text.png', { frameWidth: 38, frameHeight: 32 });
        this.load.spritesheet('player-dance', 'assets/player/playerB0.png', { frameWidth: 16, frameHeight: 32});
    }

    create() {
        playSound("stinger");

        this.add.image(288, 400, 'level-end-board').setScale(5.5);
        speedUpgrade.icon = this.add.image(140, 500, 'boots').setScale(4).setInteractive();
        luckUpgrade.icon = this.add.image(290, 500, 'luck').setScale(4).setInteractive();
        basketUpgrade.icon = this.add.image(440, 500, 'basket').setScale(4).setInteractive();
        var next_button = this.add.image(375, 685, 'next').setScale(3.5).setInteractive();

        // Text Animations
        this.anims.create({
            key: 'amazing-text',
            frames: this.anims.generateFrameNumbers('amazing-text', { start: 0, end: 14 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'nice-text',
            frames: this.anims.generateFrameNumbers('nice-text', { start: 0, end: 6 }),
            frameRate: 8,
            repeat: -1
        });

        // Level end animations
        this.anims.create({
            key: 'grandma-dance',
            frames: this.anims.generateFrameNumbers('grandma-dance', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1,
            yoyo: 1
        });
        this.anims.create({
            key: 'player-dance',
            frames: this.anims.generateFrameNumbers('player-dance', { start: 1, end: 3 }),
            frameRate: 8,
            repeat: -1,
            yoyo: 1
        });

        // End of level stats
        excessApples = score > applesNeeded ? score - applesNeeded : 0;

        var levelEndText = [
            "APPLES...",
            ">NEEDED: " + applesNeeded,
            ">CAUGHT: " + score,
            ">EXCESS: " + excessApples
        ]
        var i = 0;
        setInterval(() => {
            if (i < levelEndText.length) {
                this.add.text(75, 240 + i*30, levelEndText[i], level_end_text_style);
            } else return;
            i++;
        }, 500);

        if (excessApples > 5) { // AMAZING
            this.physics.add.staticSprite(288, 180, 'amazing-text').setScale(3).anims.play('amazing-text');
            this.physics.add.staticSprite(400, 290,'dance').setScale(5).anims.play('grandma-dance');
        }
        else { // NICE
            this.physics.add.staticSprite(288, 180, 'nice-text').setScale(3).anims.play('nice-text');
            this.physics.add.staticSprite(400, 290, 'player-dance').setScale(5).anims.play('player-dance');
        }


        // Upgrade prices
        speedUpgrade.priceText = this.add.text(110, 605, speedUpgrade.price, level_end_text_style);
        this.add.image(160, 617, 'apple').setScale(2);
        
        luckUpgrade.priceText = this.add.text(260, 605, luckUpgrade.price, level_end_text_style);
        this.add.image(310, 617, 'apple').setScale(2);
        
        basketUpgrade.priceText = this.add.text(410, 605, basketUpgrade.price, level_end_text_style);
        this.add.image(460, 617, 'apple').setScale(2);

        // Spending (excess) apples
        this.add.image(125, 675, 'apple').setScale(3);
        excessAppleText = this.add.text(150, 668, excessApples, level_end_text_style);

        // Upgrade Button functions
        var upgrades = [speedUpgrade, luckUpgrade, basketUpgrade];
        for (const currUpgrade of upgrades) {
            if (excessApples < currUpgrade.price) {
                currUpgrade.priceText.setColor("#a00");
            }
            else {
                // Purchased upgrades update their respective variables
                currUpgrade.icon.on('pointerdown', function (pointer) {
                    playSound("upgrade");
                    excessApples = excessApples - currUpgrade.price;
                    currUpgrade.applyUpgradeToGame();
                    currUpgrade.price = currUpgrade.price + 8;
                    currUpgrade.priceText.setText(currUpgrade.price);

                    stats.upgradesPurchased++;
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
            playSound("select");
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


class GameOver extends Phaser.Scene {

    constructor () {
        super('GameOver');
    }

    preload() {
        this.load.image('gameover-board', 'assets/vert_blank_board.png');
        this.load.image('exit-to-main-button', 'assets/exit_to_main_button.PNG');
        this.load.image('restart-button', 'assets/start_screen/start_button.PNG');
        this.load.spritesheet('you-lose-text', 'assets/level_end/you_lose_text.png', { frameWidth: 74, frameHeight: 32 });
        this.load.spritesheet('gameover-anim', 'assets/level_end/gameover_anim.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        playSound("gameover");

        this.add.image(288, 400, 'gameover-board').setScale(5.5);
        var exit_to_main_button = this.add.image(288, 675, 'exit-to-main-button').setScale(2.5).setInteractive();
        var restart_button = this.add.image(288, 550, 'restart-button').setScale(2.5).setInteractive();
        
        this.anims.create({
            key: 'you-lose-text',
            frames: this.anims.generateFrameNumbers('you-lose-text', { start: 1, end: 0 }),
            frameRate: 10,
            repeat: 5
        });
        this.anims.create({
            key: 'gameover-anim',
            frames: this.anims.generateFrameNumbers('gameover-anim', { start: 0, end: 1 }),
            frameRate: 8,
            repeat: -1
        });

        this.physics.add.staticSprite(225, 190, 'you-lose-text').setScale(3).anims.play('you-lose-text');
        this.physics.add.staticSprite(425, 180, 'gameover-anim').setScale(4).anims.play('gameover-anim');

        var gameover_text_style = {
            fontFamily: '"Pixelify Sans", sans-serif',
            fontSize: '25px',
            fill: '#4a1c1a',
            stroke: '#c17f38',
            strokeThickness: 3,
            align: 'right',
            wordWrap: { width: 375 }
        }

        var gameover_messages = [
            "Level reached: " + level,
            "Total apples caught: " + stats.totalApples,
            "Golden apples caught: " + stats.goldenApples,
            "Upgrades purchased: " + stats.upgradesPurchased,
            "Bananas that hit: " + stats.bananaHits
        ]
        var i = 0;
        setInterval(() => {
            if (i < gameover_messages.length) {
                this.add.text(100, 275 + i*30, gameover_messages[i], gameover_text_style);
            }
            else return;

            i++;
        }, 500);

        // Restart Button function
        restart_button.on('pointerdown', () => {
            playSound("game_start");
            this.scene.stop();
            initializeGame();
            this.scene.start('GamePlay');  
        });

        restart_button.on('pointerover', function(pointer) {
            this.setScale(2.4);
        });

        restart_button.on('pointerout', function (pointer) {
            this.setScale(2.5);
        });

        // Exit To Main Button function
        exit_to_main_button.on('pointerdown', () => {
            playSound("select");
            this.scene.stop();
            this.scene.start('StartScreen');
        });

        exit_to_main_button.on('pointerover', function(pointer) {
            this.setScale(2.4);
        });

        exit_to_main_button.on('pointerout', function (pointer) {
            this.setScale(2.5);
        });
    }

    update() {

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

        // Mobile Play
        this.load.image('jump', 'assets/mobile_play/jump.PNG');
        this.load.image('left', 'assets/mobile_play/left.PNG');
        this.load.image('right', 'assets/mobile_play/right.PNG');
        this.load.image('pause', 'assets/mobile_play/pause.PNG');
    }

     create() { 
        gameplayMusic = playSound("game_music");

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
        this.add.image(288, 400, 'tree').setScale(7.5);


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
        monkey_left = this.physics.add.staticSprite(110, 260, 'monkey').setScale(4);
        monkey_left.visible = false;

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

        // Mobile Play
        jump_button = this.add.image(188, 750, 'jump').setScale(4).setInteractive();
        left_button = this.add.sprite(288, 750, 'left').setScale(4).setInteractive();
        right_button = this.add.image(388, 750, 'right').setScale(4).setInteractive();
        var pause_button = this.add.image(40, 790, 'pause').setScale(3).setInteractive();

        pause_button.on('pointerdown', () => {
            playSound("select");
            gamePaused = true;
        });

    }


     update() {
        
        // Time
        if (this.initialTime === 0) {
            stopTimer();
            if (score < applesNeeded) {
                this.scene.stop();
                game.scene.start('GameOver')
            }
            else {
                this.scene.pause();
                game.scene.start('LevelEnd');
            }
        }

        // Pause Game
        this.input.keyboard.on('keydown-ESC', () => {
            gamePaused = true;
        });
        if (gamePaused) {
            gameplayMusic.pause();
            this.scene.pause();
            this.scene.launch('PauseGame');
        }

        // Player movement
        if (timeSinceHitByBanana < 35) {
            if (timeSinceHitByBanana == 1) {
                if (score > 1) {
                    var lostApple = apples.create(player.getCenter().x, player.getCenter().y, 'mush')
                        .setScale(3)      
                        .setVelocityY(Phaser.Math.Between(-500,-500))
                        .setVelocityX(Phaser.Math.Between(-500,500))
                        .setGravityY(appleGravityY);
                    lostApple.name = "mush";
                    score--;
                    scoreText.setText('SCORE: ' + score + '/' + applesNeeded);
                }

                stats.bananaHits++;
                playSound("banana_hit");
            }
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
            }

            if (cursors.up.isDown && player.body.blocked.down) {
                player.setVelocityY(-600);
            }

            if (cursors.down.isDown) {
                player.setVelocityY(400);
            }

            // Mobile Play
            if (mobilePlayOn) {
                left_button.visible = true;
                right_button.visible = true;
                jump_button.visible = true;

                var pointer = game.input.activePointer;
                if (pointer.isDown) {
                    // There is definitely a better/proper way to handle this...
                    // But this works for now. Ish.
    
                    // Move left
                    if ((pointer.downX > 256 && pointer.downX < 320)
                    && (pointer.downY > 718 && pointer.downY < 782)) {
                        player.setVelocityX(-speedUpgrade.effect * speedPenalty);
                        player.anims.play('left', true);
                    }
                    // Move right
                    else if ((pointer.downX > 356 && pointer.downX < 420)
                    && (pointer.downY > 718 && pointer.downY < 782)) {
                        player.setVelocityX(speedUpgrade.effect * speedPenalty);
                        player.anims.play('right', true);
                    }
                }
                else {
                    player.anims.play('still');
                }

                jump_button.on('pointerdown', () => {
                    if (player.body.blocked.down) {
                        player.setVelocityY(-600);
                    }
                });

            }
            else {
                left_button.visible = false;
                right_button.visible = false;
                jump_button.visible = false;

                if (player.body.velocity.x == 0) {
                    player.anims.play('still');
                }
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
    var monkeyToSpawn = monkey_right;
    if (!gamePaused) {
        if (monkey_right.visible && !monkey_left.visible) {
            monkeyToSpawn = monkey_left;
        }
        if (monkey_left.visible && !monkey_right.visible) {
            monkeyToSpawn = monkey_right;            
        }
        if (!(monkey_left.visible && monkey_right.visible)) {
            monkeyToSpawn.visible = true;
            animateMonkey(scene, monkeyToSpawn); 
        }

    }
}


function animateMonkey(scene, monkey) {
    monkey.anims.play('appear');
    var bananaInterval = Phaser.Math.Between(1000,4000);
    timeouts.push(setTimeout( () => {
        monkey.anims.play('toss').once('animationcomplete', () => {
            tossBanana(monkey);
        }); 
    }, bananaInterval));

    timeouts.push(setTimeout( () => {
        monkey.anims.play('giggle');
        playSound("monkey_laugh");
    }, bananaInterval + 1000));

    timeouts.push(setTimeout( () => {
        monkey.anims.playReverse('appear').once('animationcomplete', () => {
            monkey.visible = false;
        });
    }, bananaInterval + 2500));
    
}

function tossBanana(monkey) {
    var banana = bananas.create(monkey.x+40, monkey.y-100, 'banana').setScale(3);
    banana.setVelocityX(player.x - banana.x);
    banana.setVelocityY(player.y - banana.y - 50);
}

function bananaStrike(player, banana) {
    if ((banana.getCenter().x < player.getCenter().x + 60) && (banana.getCenter().x > player.getCenter().x - 60)) {
        timeSinceHitByBanana = 0;
        player.setVelocityX(-1*player.body.velocity.x);
        player.setVelocityY(-1*player.y);
    }
}

function processAppleCollision(player, apple) {
    if (apple.name != 'mush' && player.body.touching.up && (apple.getCenter().y < player.getCenter().y)) {
        collectApple(apple);
    }
    else if (apple.y > 675){
        turnAppleToMush(apple);        
    }
}

function collectApple(apple) {
    apple.disableBody(true, true);
    if (apple.name == "golden") {
        playSound("golden_collect");
        score = score + 4;
        stats.goldenApples++;
    }
    else {
        playSound("collect");
    }
    score++;
    scoreText.setText('SCORE: ' + score + '/' + applesNeeded);
    stats.totalApples++;
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
    var minutes = Math.floor(seconds/60);
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

function playSound(name) {
    var audio = new Audio("assets/sounds/" + name + ".mp3");
    audio.play();
    return audio;
}



// Text styles
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
    scene: [StartScreen, HowToPlay, GamePlay, LevelEnd, GameOver, PauseGame]
};

var game = new Phaser.Game(config);