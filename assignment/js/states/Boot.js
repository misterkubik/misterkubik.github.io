var JumpStack = JumpStack || {};

JumpStack.BootState = {
  init: function() {
    //loading screen will have a white background
    this.game.stage.backgroundColor = '#fff';

    //scaling options
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    //have the game centered horizontally
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    //Enable arcade physics
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = 500;

    this.game.world.setBounds(0, 0, this.game.world.width, 9000);
  },
  preload: function() {
    //assets we'll use in the loading screen
    this.load.image('bar', 'assets/img/preloader-bar.png');
  },
  create: function() {
    this.state.start('Preload');
  }
};






