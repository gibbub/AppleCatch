import Upgrade from "./Upgrade.js";

// Game play vars
var player;
var apples, bananas;
var applesToRecycle = [];
var monkey_right, monkey_left;
var stats = {
    totalApples: 0,
    goldenApples: 0,
    upgradesPurchased: 0,
    bananaHits: 0
};
var score = 0;
var excessApples = 0;
var scoreText, excessAppleText;
var cursors;
var continueAfterLevelWin = false;
var continueAfterUpgradeWin = false;

// Vars that change with each level
var level = 1;
var applesNeeded = 8;
var appleGravityY = 0;
var appleSpawnInterval = 2000;
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
var appleIntervalID, monkeyIntervalID, levelEndIntervalID;
var timeouts = [];

// Mobile Play & Sound
var mobilePlayOn = false;
var jump_button, left_button, right_button;
var gameplayMusic;

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
    monkeySpawnInterval = 31000;
    gamePaused = false;
    continueAfterLevelWin = false;
    continueAfterUpgradeWin = false;

    stats = {
        totalApples: 0,
        goldenApples: 0,
        upgradesPurchased: 0,
        bananaHits: 0
    };
    
    // Initialize upgrades
    speedUpgrade = new Upgrade("speed", 5, 0, 200, 5, "assets/level_end/boots.PNG");
    luckUpgrade = new Upgrade("luck", 7, 0, 1, 4, "assets/level_end/luck.PNG");
    basketUpgrade = new Upgrade("basket", 12, 0, 0, 2, "assets/level_end/basket.PNG");
}

/**
 * Updates certain variables based on current level and any upgrades.
 */
function setUpNextLevel() {
    if (continueAfterUpgradeWin) {
        score = 0;
    }
    else score = excessApples;
    excessApples = 0;
    level++;

    applesNeeded = 2*(level-1) + 2*(Math.floor(level/5)) + 8;
    var numApplesToSpawn = applesNeeded - Math.floor(level/5) + 6;
    appleSpawnInterval = 1000 * Phaser.Math.RoundTo(timelimit/numApplesToSpawn, -2);
    appleGravityY = Math.floor(5*(level-1));

    var numMonkeysToSpawn = level == 2 ? 1 : Math.floor(level/3);
    monkeySpawnInterval = 1000 * Phaser.Math.RoundTo(timelimit/(numMonkeysToSpawn+1), -2);
}

/**
 * The start screen for Apple Catch.
 * Allows player to begin the game or view the "How To Play" scene.
 */
class StartScreen extends Phaser.Scene {

    constructor () {
        super('StartScreen');
    }

    preload() {
        this.load.audio('game-start', [ 'assets/sounds/game_start.mp3']);
        this.load.audio('exit', [ 'assets/sounds/exit.mp3' ]);
        this.load.audio('select', [ 'assets/sounds/select.mp3' ]);
        this.load.image('bg', 'assets/bg_plain.PNG');
        this.load.image('bg-with-tree', 'assets/bg_tree2.PNG');
        this.load.image('game-title', 'assets/start_screen/game_title.PNG');
        this.load.image('start-button', 'assets/start_screen/start_button.PNG');
        this.load.image('how-to-button', 'assets/start_screen/how_to_button.PNG');
        this.load.spritesheet('mobile-play-toggle', 'assets/mobile_play/mobile_play_options.png', { frameWidth: 64, frameHeight: 16 });
        this.load.spritesheet('sound-toggle', 'assets/sound_toggle.png', { frameWidth: 16, frameHeight: 16 });
        this.load.image('apple', 'assets/apple.PNG');
    }

    create() {
        this.add.image(288, 416, 'bg-with-tree');
        var game_title = this.add.image(285, 219, 'game-title').setScale(3).setInteractive();
        var start_button = this.add.sprite(288, 425, 'start-button').setScale(3).setInteractive();
        var how_to_button = this.add.sprite(288, 600, 'how-to-button').setScale(3).setInteractive();
        var mobile_play_toggle = this.add.sprite(260, 715, 'mobile-play-toggle').setScale(3).setInteractive();
        var sound_toggle = this.add.sprite(385, 715, 'sound-toggle').setScale(3).setInteractive();
        this.add.text(95, 780, "Gabby Albrecht 2024", colorful_text_style);

        // Check if player is on mobile device
        if (!this.sys.game.device.os.desktop) {
            mobilePlayOn = true;
        }

        // Spawn apples when Game Title is clicked
        var startScreenApples = this.physics.add.group();
        game_title.on('pointerdown', () => {
            Phaser.Math.Between(1,2) == 1 ? this.sound.play('exit') : this.sound.play('select');
            
            startScreenApples.create(game.input.activePointer.x, game.input.activePointer.y, 'apple')
                            .setScale(3)
                            .setVelocityY(Phaser.Math.Between(-100,-350))
                            .setVelocityX(Phaser.Math.Between(-200,200))
                            .setGravityY(appleGravityY);
        });

        // Start Button Function        
        start_button.on('pointerdown', () => {
            this.sound.play("game-start");
            this.scene.stop();
            initializeGame();
            this.scene.start('GamePlay');   
        });
        start_button.on('pointerover', function(pointer) { this.setScale(2.9); });
        start_button.on('pointerout', function (pointer) { this.setScale(3); });

        // How to Button Function
        how_to_button.on('pointerdown', () => {
            this.sound.play("select");
            this.scene.stop();
            this.scene.start('HowToPlay');
        });
        how_to_button.on('pointerover', function(pointer) { this.setScale(2.9); });
        how_to_button.on('pointerout', function (pointer) { this.setScale(3); });

        // Mobile Play Toggle
        if (!this.anims.exists('mobile-play-off')) {
            this.anims.create({
                key: 'mobile-play-off',
                frames: [ { key: 'mobile-play-toggle', frame: 0 }],
            });
            this.anims.create({
                key: 'mobile-play-on',
                frames: [ { key: 'mobile-play-toggle', frame: 1}],
            })    
        }
        mobile_play_toggle.on('pointerdown', () => {
            if (mobilePlayOn) {
                this.sound.play("exit");
                mobilePlayOn = false;
                mobile_play_toggle.anims.play('mobile-play-off');
            }
            else {
                this.sound.play("select");
                mobilePlayOn = true;
                mobile_play_toggle.anims.play('mobile-play-on');
            }
        });
        if (mobilePlayOn) { mobile_play_toggle.anims.play('mobile-play-on'); }

        // Sound Toggle
        if (!this.anims.exists('sound-on')) {
            this.anims.create({
                key: 'sound-on',
                frames: [ { key: 'sound-toggle', frame: 0 }],
            });
            this.anims.create({
                key: 'sound-off',
                frames: [ { key: 'sound-toggle', frame: 1 }],
            })
        }
        if (game.sound.mute) { sound_toggle.play('sound-off'); }

        sound_toggle.on('pointerdown', () => {
            if (!game.sound.mute) {
                game.sound.mute = true;
                sound_toggle.anims.play('sound-off');
            }
            else { 
                game.sound.mute = false;
                sound_toggle.anims.play('sound-on');
                this.sound.play("select");
            }
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
        this.add.image(288, 416, 'bg-with-tree');
        this.add.image(288, 110, 'how-to-title').setScale(3);
        this.add.image(288, 450, 'how-to-play').setScale(5);
        var exit_button = this.add.image(80, 140, 'exit-button').setScale(3).setInteractive();

        var instructions =  
        "Grandma needs apples to make apple pies.\n" +
        "How many can you catch?\n\n" +
        "Use extra apples to buy upgrades, or let them carry over to the next level.\n" +
        "Beware of mischevious critters who try to distract you...";
        this.make.text({ x: 288, y: 345, text: instructions, origin: { x: 0.5, y: 0.5 }, style: howto_text_style });

        // Exit Button function
        exit_button.on('pointerdown', () => {
            this.sound.play("exit");
            this.scene.stop();
            if (gamePaused) {
                this.scene.start('PauseGame');
            } else { 
                this.scene.start('StartScreen'); 
            }
        });
        exit_button.on('pointerover', function(pointer) { this.setScale(2.5); });
        exit_button.on('pointerout', function (pointer) { this.setScale(3); });
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

/**
 * The Pause Screen for Apple Catch, which halts gameplay.
 */
class PauseGame extends Phaser.Scene {

    constructor () {
        super('PauseGame');
    }

    preload() {
        this.load.image('board', 'assets/blank_board.PNG');
        this.load.image('exit-to-main-button', 'assets/exit_to_main_button.PNG');
        this.load.image('exit', 'assets/exit_button.PNG');
    }

    create() {
        this.add.image(288, 400, 'board').setScale(4);
        var exit_button = this.add.image(90, 185, 'exit').setScale(3).setInteractive();
        var how_to_button = this.add.image(288, 315, 'how-to-button').setScale(3).setInteractive();
        var exit_to_main_button = this.add.image(288, 475, 'exit-to-main-button').setScale(3).setInteractive();
        var mobile_play_toggle = this.add.sprite(260, 625, 'mobile-play-toggle').setScale(3).setInteractive();
        var sound_toggle = this.add.sprite(385, 625, 'sound-toggle').setScale(3).setInteractive();

        // Exit Button function
        exit_button.on('pointerdown', () => {
            this.sound.play("exit");
            this.scene.stop();
            gamePaused = false;
            game.scene.resume('GamePlay');
            gameplayMusic.resume();
        });
        exit_button.on('pointerover', function(pointer) { this.setScale(2.5); });
        exit_button.on('pointerout', function (pointer) { this.setScale(3); });

        // How to Button function
        how_to_button.on('pointerdown', () => {
            this.sound.play("select");
            this.scene.stop();
            this.scene.moveAbove('GamePlay', 'HowToPlay');
            this.scene.start('HowToPlay');
        });
        how_to_button.on('pointerover', function(pointer) { this.setScale(2.9); });
        how_to_button.on('pointerout', function (pointer) { this.setScale(3); });

        // Exit To Main Button function
        exit_to_main_button.on('pointerdown', () => {
            this.sound.play("select");
            this.scene.stop();
            this.scene.stop('GamePlay');
            gamePaused = false;
            stopTimer();
            this.scene.start('StartScreen');
        });
        exit_to_main_button.on('pointerover', function(pointer) { this.setScale(2.9); });
        exit_to_main_button.on('pointerout', function (pointer) { this.setScale(3); });

        // Mobile Play Toggle
        mobile_play_toggle.on('pointerdown', () => {
            if (mobilePlayOn) {
                this.sound.play("exit");
                mobilePlayOn = false;
                mobile_play_toggle.anims.play('mobile-play-off');
            }
            else {
                this.sound.play("select");
                mobilePlayOn = true;
                mobile_play_toggle.anims.play('mobile-play-on');
            }
        });
        if (mobilePlayOn) {
            mobile_play_toggle.anims.play('mobile-play-on');
        }

        // Sound Toggle
        sound_toggle.on('pointerdown', () => {
            if (!game.sound.mute) {
                game.sound.mute = true;
                sound_toggle.anims.play('sound-off');
            }
            else { 
                game.sound.mute = false;
                sound_toggle.anims.play('sound-on');
                this.sound.play("select");
            }
        });
        if (game.sound.mute) {
            sound_toggle.play('sound-off');
        }
    }

    update() {
        this.input.keyboard.on('keydown-ESC', () => {
            gamePaused = false;
            gameplayMusic.resume();
        });
        if (!gamePaused) {
            this.scene.stop();
            game.scene.resume('GamePlay');
        }
    }
}

/**
 * A scene which is prompted at the end of each level.
 * Allows player to choose upgrades and proceed to the next level.
 */
class LevelEnd extends Phaser.Scene {

    constructor () {
        super('LevelEnd');
        this.counter = 0;
    }

    preload() {
        // this.load.audio('stinger', [ 'assets/sounds/stinger.mp3' ]);
        // this.load.audio('upgrade', [ 'assets/sounds/upgrade.mp3' ]);
        this.load.image('level-end-board', 'assets/level_end/level_end_board.PNG');
        this.load.image('boots', speedUpgrade.sprite);
        this.load.image('luck', luckUpgrade.sprite);
        this.load.image('basket', basketUpgrade.sprite);
        this.load.image('next', 'assets/level_end/next_level_button.PNG');
        this.load.spritesheet('amazing-text', 'assets/level_end/amazing_text.png', { frameWidth: 65, frameHeight: 36 });
        this.load.spritesheet('grandma-dance', 'assets/level_end/grandma_dance.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('nice-text', 'assets/level_end/nice_text.png', { frameWidth: 38, frameHeight: 32 });
        this.load.spritesheet('player-dance', 'assets/player/playerB0.png', { frameWidth: 16, frameHeight: 32});
    }

    create() {
        this.sound.play("stinger");

        this.add.image(288, 400, 'level-end-board').setScale(5.5);
        speedUpgrade.icon = this.add.image(140, 500, 'boots').setScale(4).setInteractive();
        luckUpgrade.icon = this.add.image(290, 500, 'luck').setScale(4).setInteractive();
        basketUpgrade.icon = this.add.image(440, 500, 'basket').setScale(4).setInteractive();
        var next_button = this.add.image(375, 685, 'next').setScale(3.5).setInteractive();

        if (!this.anims.exists('amazing-text')){
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
        }

        // End of level stats
        excessApples = score > applesNeeded ? score - applesNeeded : 0;
        var levelEndText = [
            "APPLES...",
            ">NEEDED: " + applesNeeded,
            ">CAUGHT: " + score,
            ">EXCESS: " + excessApples
        ]
        var i = 0;
        levelEndIntervalID = setInterval(() => {
            if (i < levelEndText.length) {
                this.add.text(75, 250 + i*30, levelEndText[i], board_text_style).setDepth(10);
            } else return;
            i++;
        }, 500);

        if (excessApples >= 8) { // AMAZING
            this.physics.add.staticSprite(288, 180, 'amazing-text').setScale(3).anims.play('amazing-text');
            this.physics.add.staticSprite(400, 290,'dance').setScale(5).anims.play('grandma-dance');
        }
        else { // NICE
            this.physics.add.staticSprite(288, 180, 'nice-text').setScale(3).anims.play('nice-text');
            this.physics.add.staticSprite(400, 290, 'player-dance').setScale(5).anims.play('player-dance');
        }

        // Upgrade prices
        speedUpgrade.priceText = this.add.text(110, 610, speedUpgrade.price, board_text_style);     // Speed
        this.add.image(90, 617, 'apple').setScale(2);

        luckUpgrade.priceText = this.add.text(260, 610, luckUpgrade.price, board_text_style);       // Luck
        this.add.image(240, 617, 'apple').setScale(2);

        basketUpgrade.priceText = this.add.text(410, 610, basketUpgrade.price, board_text_style);   // Basket
        this.add.image(390, 617, 'apple').setScale(2);

        // Spending (excess) apples
        this.add.image(125, 675, 'apple').setScale(3);
        excessAppleText = this.add.text(150, 675, excessApples, board_text_style);

        // Upgrade Button functions
        var upgrades = [speedUpgrade, luckUpgrade, basketUpgrade];
        for (const currUpgrade of upgrades) {

            // Visualize how many times upgrade has been purchased
            for (var i=0; i < currUpgrade.degree; i++) {
                currUpgrade.priceText.setText(currUpgrade.priceText.text + "*");
            }

            // If player cannot afford upgrade, set price color to red
            if (excessApples < currUpgrade.price) {
                currUpgrade.priceText.setColor("#a00");
            }
            else {
                // Purchased upgrades update their respective variables
                currUpgrade.icon.on('pointerdown', function (pointer) {
                    game.sound.play("upgrade");
                    excessApples = excessApples - currUpgrade.price;
                    currUpgrade.applyUpgradeToGame();
                    currUpgrade.price = currUpgrade.price + Math.floor(currUpgrade.price/2);
                    currUpgrade.priceText.setText(currUpgrade.price);

                    for (var i=0; i < currUpgrade.degree; i++) {
                        currUpgrade.priceText.setText(currUpgrade.priceText.text + "*");
                    }
                    stats.upgradesPurchased++;
                });
                currUpgrade.icon.on('pointerover', function(pointer) { this.setScale(4.5); });
                currUpgrade.icon.on('pointerout', function (pointer) { this.setScale(4); });
            }
        }

        // Next Level Button function
        next_button.on('pointerdown', () => {
            clearInterval(levelEndIntervalID);
            this.sound.play("select");
            setUpNextLevel();
            this.scene.stop();
            this.scene.start('GamePlay');
        });
        next_button.on('pointerover', function(pointer) { this.setScale(3); });
        next_button.on('pointerout', function (pointer) { this.setScale(3.5); });
        
        this.counter = 0;
    }

    update() {
        this.input.keyboard.on('keydown-ENTER', () => {
            if (this.counter == 0) {
                this.counter++;
                clearInterval(levelEndIntervalID);
                this.scene.stop();
                setUpNextLevel();
                this.scene.start('GamePlay');
            }
        });

        // If player cannot afford an upgrade, set price color to Red and make uninteractive
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

        if (speedUpgrade.degree == speedUpgrade.max) {
            speedUpgrade.priceText.setColor("#a00");
            speedUpgrade.priceText.setText("MAX");
            speedUpgrade.icon.setScale(4).disableInteractive();
        }
        if (luckUpgrade.degree == luckUpgrade.max) {
            luckUpgrade.priceText.setColor("#a00");
            luckUpgrade.priceText.setText("MAX");
            luckUpgrade.icon.setScale(4).disableInteractive();
        }
        if (basketUpgrade.degree == basketUpgrade.max) {
            basketUpgrade.priceText.setColor("#a00");
            basketUpgrade.priceText.setText("MAX");
            basketUpgrade.icon.setScale(4).disableInteractive();
        }
        
        excessAppleText.setText(excessApples);
    }
}

/**
 * The Gameover screen, which is triggered upon not collecting enough apples at the end of a level.
 */
class GameOver extends Phaser.Scene {

    constructor () {
        super('GameOver');
    }

    preload() {
        // this.load.audio('gameover', [ 'assets/sounds/gameover.mp3' ]);
        this.load.image('gameover-board', 'assets/vert_blank_board.png');
        this.load.image('exit-to-main-button', 'assets/exit_to_main_button.PNG');
        this.load.image('restart-button', 'assets/start_screen/start_button.PNG');
        this.load.spritesheet('you-lose-text', 'assets/level_end/you_lose_text.png', { frameWidth: 74, frameHeight: 32 });
        this.load.spritesheet('gameover-anim', 'assets/level_end/gameover_anim.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        this.sound.play("gameover");

        this.add.image(288, 416, 'bg-with-tree');
        this.add.image(288, 400, 'gameover-board').setScale(5.5);
        var exit_to_main_button = this.add.image(288, 675, 'exit-to-main-button').setScale(2.5).setInteractive();
        var restart_button = this.add.image(288, 550, 'restart-button').setScale(2.5).setInteractive();
        
        // Game over animations
        if (!this.anims.exists('gameover-anim')){
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
        }

        this.physics.add.staticSprite(225, 190, 'you-lose-text').setScale(3).anims.play('you-lose-text');
        this.physics.add.staticSprite(425, 180, 'gameover-anim').setScale(4).anims.play('gameover-anim');

        // Game stats display
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
                this.add.text(95, 275 + i*30, gameover_messages[i], board_text_style);
            }
            else return;

            i++;
        }, 500);

        // Restart Button function
        restart_button.on('pointerdown', () => {
            this.sound.play("game-start");
            this.scene.stop();
            initializeGame();
            this.scene.start('GamePlay');  
        });
        restart_button.on('pointerover', function(pointer) { this.setScale(2.4); });
        restart_button.on('pointerout', function (pointer) { this.setScale(2.5); });

        // Exit To Main Button function
        exit_to_main_button.on('pointerdown', () => {
            this.sound.play("select");
            this.scene.stop();
            this.scene.start('StartScreen');
        });
        exit_to_main_button.on('pointerover', function(pointer) { this.setScale(2.4); });
        exit_to_main_button.on('pointerout', function (pointer) { this.setScale(2.5); });
    }
}

class GameWin extends Phaser.Scene {

    constructor () {
        super('GameWin');
    }

    preload() {
        // this.load.audio('gamewin', [ 'assets/sounds/gamewin.mp3' ]);
        this.load.image('level-win', 'assets/level_end/level_win.png');
        this.load.image('upgrade-win', 'assets/level_end/upgrade_win.png');
        this.load.image('board', 'assets/blank_board.PNG');
        this.load.image('exit-to-main-button', 'assets/exit_to_main_button.PNG');
        this.load.image('stats-button', 'assets/level_end/stats_button.png');
        this.load.image('continue-button', 'assets/level_end/continue_button.png');
    }

    create() {
        this.sound.play("gamewin");

        var winMessage = "";
        var winType = "";
        if (level == 30 && !continueAfterLevelWin) {
            excessApples = score - applesNeeded;
            winType = "level";
            this.add.image(288, 416, 'level-win');
            winMessage = "YOU WIN!"
            + "\nYou played for a while! Grandma's apple pies have never tasted better.";
        }
        else if (!continueAfterUpgradeWin){
            winType = "upgrade";
            this.add.image(288, 416, 'upgrade-win');
            winMessage = "YOU WIN!"
            + "\nAll upgrades purchased.";
        }
        var txt = this.add.text(290, 450, winMessage, colorful_text_style).setOrigin(0.5);
        this.add.rectangle(txt.x, txt.y, 600, txt.height+20, 0x04577b, 0.8).setOrigin(0.5);
        txt.depth = 10;

        var statsBoard = this.add.image(288, 200, 'board').setScale(4).setVisible(false);
        var statsList =
        "Level reached: " + `${level}` +
        "\n\nTotal apples caught: " + `${stats.totalApples}` +
        "\n\nGolden apples caught: " + `${stats.goldenApples}` +
        "\n\nUpgrades purchased: " + `${stats.upgradesPurchased}` +
        "\n\nBananas that hit: " + `${stats.bananaHits}`;
        var statsText = this.add.text(80, 100, statsList, board_text_style).setVisible(false);

        var stats_button = this.add.image(85, 615, 'stats-button').setScale(3).setInteractive();
        var continue_button = this.add.image(255, 615, 'continue-button').setScale(3).setInteractive();
        var exit_to_main_button = this.add.image(190, 735, 'exit-to-main-button').setScale(3).setInteractive();

        // Stats Button function
        stats_button.on('pointerdown', () => {
            this.sound.play("select");
            if (!statsBoard.visible) {
                statsBoard.setVisible(true);
                statsText.setVisible(true);
            }
            else {
                statsBoard.setVisible(false);
                statsText.setVisible(false);
            }
        });
        stats_button.on('pointerover', function(pointer) { this.setScale(2.9); });
        stats_button.on('pointerout', function (pointer) { this.setScale(3); });

        // Continue Button function
        var warning = this.add.text(380, 600, 
            "Warning: If you continue, your excess apples will no longer carry over to the next level",
            { fontFamily: '"Press Start"',
            fontSize: '11px',
            color: '#fff000',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'left',
            wordWrap: { width: 175 }
        }).setVisible(false);
        if (mobilePlayOn && winType == "upgrade") warning.setVisible(true);

        continue_button.on('pointerdown', () => {    
            this.sound.play("select");        
            if (winType == "level") {
                continueAfterLevelWin = true;
            }
            if (winType == "upgrade") {
                continueAfterUpgradeWin = true;
            }
            setUpNextLevel();
            this.scene.stop();
            this.scene.start('GamePlay');
        });
        continue_button.on('pointerover', function(pointer) { 
            this.setScale(2.9); 
            if (winType == "upgrade") warning.setVisible(true);
        });
        continue_button.on('pointerout', function (pointer) { 
            this.setScale(3);
            if (!mobilePlayOn) warning.setVisible(false); 
        });

        // Exit To Main Button function
        exit_to_main_button.on('pointerdown', () => {
            this.sound.play("select");
            this.scene.stop();
            this.scene.start('StartScreen');
        });
        exit_to_main_button.on('pointerover', function(pointer) { this.setScale(2.9); });
        exit_to_main_button.on('pointerout', function (pointer) { this.setScale(3); });
    }
    
}

/**
 * The actual gameplay of Apple Catch
 */
class GamePlay extends Phaser.Scene {

    constructor () {
        super('GamePlay');
    }

     preload() {
        // Load Progress Bar!
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x04577b, 0.5);
        progressBox.fillRect(130, 300, 320, 50);

        var percentText = this.make.text({ x:288, y: 325, text: '0%', style: board_text_style });
        percentText.setOrigin(0.5, 0.5);
        
        var assetText = this.make.text({ x: 288, y: 370, text: '', style: board_text_style });
        assetText.setOrigin(0.5, 0.5);

        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xceeffd, 1);
            progressBar.fillRect(140, 310, 300 * value, 30);
        });

        this.load.on('fileprogress', function (file) {
            assetText.setText("Loading: " + file.key);
        });

        this.load.on('complete', function () {
            assetText.destroy();
            percentText.destroy();
            progressBar.destroy();
            progressBox.destroy();
        });

        // Assets to load
        this.load.audio('game_music', [ 'assets/sounds/game_music.mp3' ]);
        this.load.audio('collect', [ 'assets/sounds/collect.mp3'] );
        this.load.audio('golden-collect', [ 'assets/sounds/golden_collect.mp3'] );
        this.load.audio('monkey-laugh', [ 'assets/sounds/monkey_laugh.mp3'] );
        this.load.audio('banana-deflect', [ 'assets/sounds/banana_deflect.mp3'] );
        this.load.audio('banana-hit', [ 'assets/sounds/banana_hit.mp3'] );
        this.load.audio('stinger', [ 'assets/sounds/stinger.mp3' ]);
        this.load.audio('upgrade', [ 'assets/sounds/upgrade.mp3' ]);
        this.load.audio('gamewin', [ 'assets/sounds/gamewin.mp3' ]);
        this.load.audio('gameover', [ 'assets/sounds/gameover.mp3' ]);

        this.load.image('mush', 'assets/mush.PNG');
        this.load.image('golden-apple', 'assets/golden_apple.PNG');
        this.load.image('golden-mush', 'assets/golden_mush.PNG');
        this.load.image('banana', 'assets/banana.PNG');
        this.load.image('tree', 'assets/tree.PNG');
        this.load.image('tiles', 'assets/ground_tileset.png');
        this.load.tilemapTiledJSON('ground', 'assets/ground.json');
        this.load.spritesheet('playerB0', 'assets/player/playerB0.png', { frameWidth: 16 + 16*basketUpgrade.degree, frameHeight: 32 });
        this.load.spritesheet('playerB1', 'assets/player/playerB1.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('playerB2', 'assets/player/playerB2.png', { frameWidth: 48, frameHeight: 32 });
        this.load.spritesheet('playerB2-1', 'assets/player/playerB2.1.png', { frameWidth: 48, frameHeight: 32 });
        this.load.spritesheet('playerB2-0', 'assets/player/playerB2.0.png', { frameWidth: 48, frameHeight: 32 });
        this.load.spritesheet('monkey', 'assets/monkey.png', { frameWidth: 96, frameHeight: 96});

        // Mobile Play
        this.load.image('jump', 'assets/mobile_play/jump.PNG');
        this.load.image('left', 'assets/mobile_play/left.PNG');
        this.load.image('right', 'assets/mobile_play/right.PNG');
        this.load.image('pause', 'assets/mobile_play/pause.PNG');

        this.load.image('have fun!', 'assets/apple.PNG');
    }

     create() { 
        gamePaused = false;
        gameplayMusic = this.sound.add('game_music');
        gameplayMusic.play();

        // Background & ground graphics
        this.add.image(288, 416, 'bg');
        this.add.image(100, 575, 'tree').setScale(3).alpha = 0.4;
        this.add.image(475, 575, 'tree').setScale(3).alpha = 0.4;
        this.add.image(288, 400, 'tree').setScale(7.5);
        const map = this.make.tilemap({ key: 'ground' });
        const tiles = map.addTilesetImage('apple catch', 'tiles');
        const layer = map.createLayer(0, tiles, 0, 0);
        layer.setScale(4);

        // Scoring, level, & time
        scoreText = this.add.text(16, 16, 'SCORE: ' + score + '/' + applesNeeded, colorful_text_style);
        this.add.text(16, 45, 'Level ' + level, colorful_text_style);

        this.initialTime = timelimit;
        countdownText = this.add.text(300, 16, 
            'TIME LEFT: ' + `${this.initialTime.toString()}`,
            colorful_text_style
        );
        timedEvent = this.time.addEvent({ delay: 1000, callback: onEvent, callbackScope: this, loop: true });

        // Player creation & animations
        var playerSprite = 'playerB' + basketUpgrade.degree;
        player = this.physics.add.sprite(288, 500, playerSprite);
        player.setCollideWorldBounds(true).setBounce(0.2).setScale(4);
        player.body.setGravityY(1000);
        if (basketUpgrade.degree >= 2) {
            basketUpgrade.effect = 2;
        }
        makePlayerAnimations(this, playerSprite);

        // Monkeys
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
        monkeyIntervalID = setInterval( () => { // Spawn monkey
            spawnMonkey();
        }, monkeySpawnInterval);

        // Apples & bananas
        apples = this.physics.add.group();
        applesToRecycle = [];
        appleIntervalID = setInterval(spawnApple, appleSpawnInterval);
        bananas = this.physics.add.group();
        
        // Set colliders
        layer.setCollisionByExclusion([-1]);
        this.physics.add.collider(player, layer);
        this.physics.add.collider(apples, layer);
        this.physics.add.overlap(player, apples, processAppleCollision, null, this);
        this.physics.add.overlap(player, bananas, bananaStrike, null, this);

        // Controls
        cursors = this.input.keyboard.createCursorKeys();

        // Mobile Play
        jump_button = this.add.image(288, 750, 'jump').setScale(4.5).setInteractive();
        left_button = this.add.image(150, 750, 'left').setScale(4).setAlpha(0.7).setInteractive();
        right_button = this.add.image(426, 750, 'right').setScale(4).setAlpha(0.7).setInteractive();
        var pause_button = this.add.image(40, 790, 'pause').setScale(3).setInteractive();

        pause_button.on('pointerdown', () => {
            this.sound.play("select");
            gamePaused = true;
        });
    }


     update() {
        // Time
        if (this.initialTime === 0) {
            stopTimer();
            // GAME OVER
            if (score < applesNeeded) {
                this.scene.stop();
                game.scene.start('GameOver')
            } // GAME WIN
            else if ((level >= 30 && !continueAfterLevelWin) || (stats.upgradesPurchased >= 11 && !continueAfterUpgradeWin)) {
                this.scene.stop();
                game.scene.start('GameWin');
            } // END LEVEL
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
            timeSinceHitByBanana++;
            player.anims.play('shock');
        }
        else {
            // Speed penalty applied when player walks over mushed apple
            var speedPenalty = 1;
            if (this.physics.overlap(player, apples)) {
                speedPenalty = 0.7;
            }

            // Keyboard movement
            if (cursors.left.isDown) {
                player.setVelocityX(-speedUpgrade.effect * speedPenalty);
                player.anims.play('left', true);
            }
            else if (cursors.right.isDown) {
                player.setVelocityX(speedUpgrade.effect * speedPenalty);
                player.anims.play('right', true);
            } else { player.setVelocityX(0); }
            
            if (cursors.up.isDown && player.body.blocked.down) {
                player.setVelocityY(-600);
            }

            // Mobile Play
            if (mobilePlayOn) {
                left_button.visible = true;
                right_button.visible = true;
                jump_button.visible = true;

                var pointer = game.input.activePointer;
                
                if (pointer.isDown) {    
                    // Move left
                    if (pointer.downX < 240) {
                        player.setVelocityX(-speedUpgrade.effect * speedPenalty);
                        player.anims.play('left', true);
                    }
                    // Move right
                    else if (pointer.downX > 336) {
                        player.setVelocityX(speedUpgrade.effect * speedPenalty);
                        player.anims.play('right', true);
                    }
                }
                else { player.anims.play('still'); }
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

/** 
 * Creates player animations based on how many basket upgrades have been made
 * @param {Phaser.Scene} s       : The current scene
 * @param {String} playerSprite  : The spritesheet to use for animations
 */
function makePlayerAnimations(s, playerSprite) {
    // If a basket purchase has been made, OR previous player sprite is different than current,
    // remove all current player animations
    if (basketUpgrade.degree > 0 ||
        (s.anims.exists('left') && s.anims.anims.entries.left.frames[0].textureKey != playerSprite)) {
        s.anims.remove('left');
        s.anims.remove('still');
        s.anims.remove('right');
        s.anims.remove('shock');
    }
    // If no player animation exists, create them
    if (!s.anims.exists('left')) {
        s.anims.create({
            key: 'left',
            frames: s.anims.generateFrameNumbers(playerSprite, { start: 0, end: 2}),
            frameRate: 10,
            repeat: -1
        });
        s.anims.create({
            key: 'still',
            frames: [ { key: playerSprite, frame: 2 } ],
            frameRate: 20
        });
        s.anims.create({
            key: 'right',
            frames: s.anims.generateFrameNumbers(playerSprite, { start: 2, end: 4}),
            frameRate: 10,
            repeat: -1
        });
        s.anims.create({
            key: 'shock',
            frames: [ { key: playerSprite, frame: 5 } ],
            frameRate: 1
        });
    }
}

/**
 * Determines a random coordinate to spawn a regular or golden apple.
 */
function spawnApple() {
    if (!gamePaused) {
        var xCoord = Phaser.Math.Between(125, 475);
        var yCoord = Phaser.Math.Between(100, 400);
        var randomRoll = Phaser.Math.Between(0, 100);
    
        var apple;
        if (randomRoll < (3 * luckUpgrade.effect)) { // Spawn Golden Apple
            apple = apples.create(xCoord, yCoord, 'golden-apple').setScale(3);
            apple.name = "golden";
        }
        else {
            // Recycles apple objects which have already been caught in order to save memory & reduce lag
            if (applesToRecycle.length >= 1) {
                apple = applesToRecycle.pop();
                apple.setTexture('apple');
                apple.setPosition(xCoord, yCoord);
                apple.setActive(true).setVisible(true);
                apple.body.enable = true;
            }
            else {
                apple = apples.create(xCoord, yCoord, 'apple').setScale(3);
            }
        }
        apple.setBounce(0.1)
            .setVelocityY(Phaser.Math.Between(-50, 0))
            .setGravityY(appleGravityY)
            .setCollideWorldBounds(true);
    }
}

/**
 * Spawns a monkey on either the left or right side of the tree.
 */
function spawnMonkey() {
    var monkeyToSpawn = Phaser.Math.Between(0, 1) == 0 ? monkey_right : monkey_left;
    if (!gamePaused) {
        if (monkey_right.visible && !monkey_left.visible) {
            monkeyToSpawn = monkey_left;
        }
        if (monkey_left.visible && !monkey_right.visible) {
            monkeyToSpawn = monkey_right;            
        }
        if (!(monkey_left.visible && monkey_right.visible)) {
            monkeyToSpawn.visible = true;
            animateMonkey(monkeyToSpawn); 
        }
    }
}

/**
 * Animates the specified monkey.
 * @param {*} monkey : The monkey to animate.
 */
function animateMonkey(monkey) {
    monkey.anims.play('appear');
    var bananaInterval = Phaser.Math.Between(1000,4000);    // Interval before throwing banana
   
    // Throws banana
    timeouts.push(setTimeout( () => {
        monkey.anims.play('toss').once('animationcomplete', () => {
            var banana = bananas.create(monkey.x+40, monkey.y-100, 'banana').setScale(3);
            banana.setVelocityX(player.x - banana.x);
            banana.setVelocityY(player.y - banana.y - 50);
        }); 
    }, bananaInterval));

    // Giggle
    timeouts.push(setTimeout( () => {   
        monkey.anims.play('giggle');
        game.sound.play("monkey-laugh");
    }, bananaInterval + 1000));

    // Disappear
    timeouts.push(setTimeout( () => {   
        monkey.anims.playReverse('appear').once('animationcomplete', () => {
            monkey.visible = false;
        });
    }, bananaInterval + 2500));
}

/**
 * Called when a banana collides with a player.
 * If banana collides with the specified player hitbox, the player is sent flying in the opposite direction of their current velocity.
 * @param {*} player : The player.
 * @param {*} banana : The banana which has struck the player.
 */
function bananaStrike(player, banana) {
    if ((banana.getCenter().x < player.getCenter().x + 60) && (banana.getCenter().x > player.getCenter().x - 60)) {
        bananas.remove(banana);

        // If final basket upgrade purchased, it will deflect 2 bananas
        if (basketUpgrade.degree >= 2 && basketUpgrade.effect > 0) {
            game.sound.play("banana-deflect");
            basketUpgrade.effect--;
            banana.setVelocityX(-banana.body.velocity.x * 5);
            banana.setVelocityY(-banana.body.velocity.y);
            makePlayerAnimations(this, 'playerB2-' + basketUpgrade.effect);
        }
        else {
            game.sound.play("banana-hit");
            timeSinceHitByBanana = 0;
            player.setVelocityX(-1*player.body.velocity.x);
            player.setVelocityY(-1*player.y);   
            if (score > 1) {
                // When player is hit by banana, they lose an apple
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
        }
    }
}

/**
 * Called when the player collides with an apple.
 * Determines if player can collect apple, or they are simply stepping on one.
 * @param {*} player : The player.
 * @param {*} apple : The apple which has collided with the player.
 */
function processAppleCollision(player, apple) {
    if (apple.name != 'mush' && player.body.touching.up && (apple.getCenter().y < player.getCenter().y)) {
        collectApple(apple);
    }
    else if (apple.y > 675){    // If apple is below certain y value, player can no longer collect it.
        turnAppleToMush(apple);        
    }
}

/**
 * Removes the collected apple from the game and increases the player score.
 * @param {*} apple : The apple to collect.
 */
function collectApple(apple) {
    if (apple.name == "golden") {
        apple.destroy();
        game.sound.play("golden-collect");
        score = score + 2;
        stats.goldenApples++;
    }
    else { 
        //apple.setVisible(false).setActive(false);
        apple.disableBody(true, true);
        applesToRecycle.push(apple)
        game.sound.play("collect"); 
    }
    score++;
    scoreText.setText('SCORE: ' + score + '/' + applesNeeded);
    stats.totalApples++;
}

/**
 * Changes the texture of an apple to mush when it is stepped on by the player.
 * @param {*} apple : The apple to turn to mush.
 */
function turnAppleToMush(apple) {
    if (apple.name != "mush") {
        if (apple.name == "golden") {
            apple.setTexture('golden-mush');
        }
        else { apple.setTexture('mush'); }
        apple.name = "mush";
    }
}

/**
 * Pauses the game timer, and any current intervals.
 */
function stopTimer() {
    timedEvent.paused = true;
    clearInterval(appleIntervalID);
    clearInterval(monkeyIntervalID);
    for (var i=0; i <timeouts.length; i++) {
        clearTimeout(timeouts[i]);
    }
}

/**
 * Decreases time left per second.
 */
function onEvent() {
    this.initialTime--;
    countdownText.setText('TIME LEFT: ' + `${this.initialTime.toString()}`);
}

// Text styles
var howto_text_style = {
    fontFamily: '"Press Start"',
    fontSize: '16px',
    fill: '#4a1c1a',
    stroke: '#c17f38',
    strokeThickness: 3,
    align: 'center',
    wordWrap: { width: 350 }
};
var colorful_text_style = {
    fontFamily: '"Press Start"',
    fontSize: '20px',
    fill: '#fe3',
    stroke: '#f54',
    strokeThickness: 3,
    align: 'center',
    shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#f0e',
        blur: 5,
        fill: true
    },
    wordWrap: { width: 512 }
};
var board_text_style = {
    fontFamily: '"Press Start"',
    fontSize: '16px',
    fill: '#4a1c1a',
    stroke: '#c17f38',
    strokeThickness: 3,
    align: 'left',
}

// Game configuration
var config = {
    type: Phaser.AUTO,
    width: 576,
    height: 832,
    scale: {
        mode: Phaser.Scale.FIT
    },
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
    scene: [StartScreen, HowToPlay, GamePlay, LevelEnd, GameOver, GameWin, PauseGame]
};
var game = new Phaser.Game(config);