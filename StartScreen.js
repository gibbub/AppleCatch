
/**
 * The start screen for Apple Catch.
 * Allows player to begin the game or view the "How To Play" scene.
 */
export default class StartScreen extends Phaser.Scene {

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
        var game = this.game;
        var mobilePlayOn = game.config.mobilePlayOn;
        var colorful_text_style = {
            fontFamily: '"Press Start"',
            fontSize: '20px',
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

        this.add.image(288, 416, 'bg-with-tree');
        var game_title = this.add.image(285, 219, 'game-title').setScale(3).setInteractive();
        var start_button = this.add.sprite(288, 425, 'start-button').setScale(3).setInteractive();
        var how_to_button = this.add.sprite(288, 600, 'how-to-button').setScale(3).setInteractive();
        var mobile_play_toggle = this.add.sprite(260, 715, 'mobile-play-toggle').setScale(3).setInteractive();
        var sound_toggle = this.add.sprite(385, 715, 'sound-toggle').setScale(3).setInteractive();
        this.add.text(95, 780, "Gabby Albrecht 2024", colorful_text_style);

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