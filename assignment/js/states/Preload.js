var JumpStack = JumpStack || {};

JumpStack.PreloadState = {
    //load the game assets before the game starts
    preload() {
        this.load.atlasJSONHash('GameAtlas', 'assets/atlases/GameAtlas.png', 'assets/atlases/GameAtlas.json');   
    },
    create() {
        this.state.start('Game');
    }
};