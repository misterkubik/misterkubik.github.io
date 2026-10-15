var Match3 = Match3 || {};

//loading the game assets
Match3.PreloadState = {
  preload: function() {
    //show loading screen
    this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'bar');
    this.preloadBar.anchor.setTo(0.5);
    this.preloadBar.scale.setTo(200, 1);
    this.load.setPreloadSprite(this.preloadBar);

    //load game assets
    this.load.atlasJSONHash('blocks', 'assets/img/blocks-atlas.png', 'assets/img/blocks-atlas.json');
    this.load.image('background', 'assets/img/background.jpg');

    this.load.audio('wobble', ['assets/sfx/wobble.mp3', 'assets/sfx/wobble.ogg']);
    this.load.audio('pop1', ['assets/sfx/pop1.mp3', 'assets/sfx/pop1.ogg']);
    this.load.audio('pop2', ['assets/sfx/pop2.mp3', 'assets/sfx/pop2.ogg']);
    this.load.audio('pop3', ['assets/sfx/pop3.mp3', 'assets/sfx/pop3.ogg']);
    this.load.audio('pop4', ['assets/sfx/pop4.mp3', 'assets/sfx/pop4.ogg']);
    this.load.audio('pop5', ['assets/sfx/pop5.mp3', 'assets/sfx/pop5.ogg']);

  },
  create: function() {
    this.state.start('Game');
  }
};