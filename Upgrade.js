class Upgrade {

    /**
     * @constructor
     * 
     * @param {String} name     : name of this upgrade
     * @param {Number} price    : apples needed to purchase upgrade
     * @param {Number} degree   : how many times upgrade has been purchased; strength of upgrade
     * @param {Number} effect   : used to update certain variables based on upgrade
     * @param {Number} max      : maximum number of times this upgrade can be purchased
     * @param {String} sprite   : location of image representing upgrade
     * 
     * @var {Phaser.GameObjects.Image}  : in-game icon representing upgrade
     * @var {Phaser.GameObjects.Text}   : in-game text representing upgrade price
     */
    constructor(name, price, degree, effect, max, sprite) {
        this.name = name;
        this.price = price;
        this.degree = degree;
        this.effect = effect;
        this.max = max;
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
        // The basket upgrade is handled through the degree value
    }

} export default Upgrade;