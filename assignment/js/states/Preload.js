var JumpStack = JumpStack || {};

JumpStack.PreloadState = {
    //load the game assets before the game starts
    preload() {
        this.load.atlasJSONHash('GameAtlas', 'assets/atlases/GameAtlas.png', 'assets/atlases/GameAtlas.json');   
        this.load.atlasJSONHash('Fruits', 'assets/atlases/FruitsAtlas.png', 'assets/atlases/FruitsAtlas.json');   
        this.load.atlasJSONHash('Frog', 'assets/atlases/frogChar.png', 'assets/atlases/frogChar.json');     
        this.load.atlasJSONHash('Background', 'assets/atlases/bgLayered.png', 'assets/atlases/bgLayered.json'); 
        this.load.atlasJSONHash('Hint', 'assets/atlases/hintAtlas.png', 'assets/atlases/hintAtlas.json');  

        // this.load.image('Play', 'assets/img/play.png');  
        // this.load.image('Retry', 'assets/img/retry.png');  

        // this.load.bitmapFont('FranklinGothicHeavy36', 'assets/fonts/FranklinGothicHeavy-36.png', 'assets/fonts/FranklinGothicHeavy-36.xml', 5, 5);   
    },
    create() {
        this.state.start('Game');
    }
};