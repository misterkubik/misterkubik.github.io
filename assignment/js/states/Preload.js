var JumpStack = JumpStack || {};

JumpStack.PreloadState = {
    //load the game assets before the game starts
    preload() {
        this.load.atlasJSONHash('GameAtlas', 'assets/atlases/GameAtlas.png', 'assets/atlases/GameAtlas.json');   
        this.load.atlasJSONHash('Fruits', 'assets/atlases/FruitsAtlas.png', 'assets/atlases/FruitsAtlas.json');   
        this.load.bitmapFont('FranklinGothicHeavy36', 'assets/atlases/GameAtlas.png', 'assets/fonts/FranklinGothicHeavy-36.xml');   
    },
    create() {
        this.state.start('Game');
    }
};