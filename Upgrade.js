class Upgrade {

    /**
     * @constructor
     * 
     * @param {String} name     : name of this upgrade
     * @param {Number} price    : apples needed to purchase upgrade
     * @param {Number} degree   : how many times upgrade has been purchased; strength of upgrade
     * @param {Number} effect   : used to update certain variables based on upgrade
     * @param {String} sprite   : location of image representing upgrade
     * 
     * @var {Phaser.GameObjects.Image}  : in-game icon representing upgrade
     * @var {Phaser.GameObjects.Text}   : in-game text representing upgrade price
     */
    constructor(name, price, degree, effect, sprite) {
        this.name = name;
        this.price = price;
        this.degree = degree;
        this.effect = effect;
        this.sprite = sprite;

        this.icon = null;
        this.priceText = null;
    }

    applyUpgradeToGame() {
        this.degree++;
        
        if (this.name == "speed") {
            this.effect = this.effect + 80;
        }
        if (this.name == "luck") {
            this.effect++;
        }
        if (this.name == "basket") {
            // TODO: Update player sprite
        }
    }

} export default Upgrade;