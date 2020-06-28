//this game will have only 1 state
var GameState = {

  //initiate game settings
  init: function() {
    //adapt to screen size, fit all the game
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = 1000;
  },

  //load the game assets before the game starts
  preload: function() {
    this.load.image('ground', 'assets/images/ground.png');    
    this.load.image('platform', 'assets/images/platform.png');    
    this.load.image('goal', 'assets/images/gorilla3.png');    
    this.load.image('arrowButton', 'assets/images/arrowButton.png');    
    this.load.image('actionButton', 'assets/images/actionButton.png');    
    this.load.image('barrel', 'assets/images/barrel.png');    

    this.load.spritesheet('player', 'assets/images/luigi_spritesheet.png', 34, 56, 10, 0, 0);    
    this.load.spritesheet('fire', 'assets/images/fire_spritesheet.png', 32, 55, 4, 0, 0);      
  },
  //executed after everything is loaded
  create: function() {    

    this.ground = this.add.sprite(0, 500, 'ground');
    this.game.physics.arcade.enable(this.ground);
    this.ground.body.allowGravity = false;
    this.ground.body.immovable = true;
    // console.log(this.ground.body);

    this.platform = this.add.sprite(0, 300, 'platform');
    this.game.physics.arcade.enable(this.platform);
    this.platform.body.allowGravity = false;
    this.platform.body.immovable = true;

    //add fire
    this.fire = this.add.sprite(100, 300, 'fire', 1);
    this.game.physics.arcade.enable(this.fire);
    this.fire.body.allowGravity = false;
    this.fire.body.immovable = true;

    this.fire.anchor.setTo(0.5, 1);
    this.fire.scale.setTo(0.7);
    this.fire.animations.add('flame', [0,1,2,3], 8, true, true);
    this.fire.play('flame');



    //create player
    this.player = this.add.sprite(100, 200, 'player', 9);
    this.game.physics.arcade.enable(this.player);
    this.player.anchor.setTo(0.5,1);
    // this.player.scale.setTo(2);
    this.player.animations.add('walking', [1, 2, 3, 4, 5, 6, 7, 8], 12, true);
    // this.player.play('walking');

  },
  update: function() {
    this.game.physics.arcade.collide(this.player, this.ground, this.landed);
    this.game.physics.arcade.collide(this.player, this.platform, this.landed);
    // this.game.physics.arcade.overlap(this.player, this.fire, this.landed);
  },
  landed(player, ground){
    // console.log('Landed on ' +  ground.key);

  }
  
  
};

//initiate the Phaser framework
var game = new Phaser.Game(360, 592, Phaser.AUTO);

game.state.add('GameState', GameState);
game.state.start('GameState');

