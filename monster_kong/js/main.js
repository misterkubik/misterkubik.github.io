//this game will have only 1 state
var GameState = {

  //initiate game settings
  init() {
    //adapt to screen size, fit all the game
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = 1000;

    this.cursors = this.game.input.keyboard.createCursorKeys();

    this.PLAYER_SPEED = 200;
    this.JUMP_SPEED = 600;
  },

  //load the game assets before the game starts
  preload() {
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
  create() {    

    this.ground = this.add.sprite(this.game.world.centerX, this.game.world.height, 'ground');
    this.ground.anchor.setTo(.5, 1);
    this.game.physics.arcade.enable(this.ground);
    this.ground.body.allowGravity = false;
    this.ground.body.immovable = true;
    // console.log(this.ground.body);

    var platformData = [
      {x: 0, y: 500},
      {x: 45, y: 50},
      {x: 90, y: 350},
      {x: 0, y: 200}
    ];

    this.platforms = this.add.group();
    this.platforms.enableBody = true;

    platformData.forEach(item => {
      this.platforms.create(item.x, item.y, 'platform');

    }, this);

    this.platforms.setAll('body.immovable', true);
    this.platforms.setAll('body.allowGravity', false);

    // this.platform = this.add.sprite(0, 300, 'platform');
    // this.game.physics.arcade.enable(this.platform);
    // this.platform.body.allowGravity = false;
    // this.platform.body.immovable = true;

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
    this.player.animations.add('idle', [9], 12, true);
    this.player.animations.add('walking', [1, 2, 3, 4, 5, 6, 7, 8], 12, true);
    // this.player.play('walking');
    this.player.customParams = {};

    this.createOnscreenControls();


  },

  createOnscreenControls() {
    this.leftArrow = this.add.button(20, 535, 'arrowButton');
    this.rightArrow = this.add.button(170, 535, 'arrowButton');
    this.rightArrow.scale.x = -1;
    this.actionButton = this.add.button(280, 535, 'actionButton');

    this.leftArrow.alpha = this.rightArrow.alpha = this.actionButton.alpha = 0.5;

    //jump
    this.actionButton.events.onInputDown.add(function(){
      this.player.customParams.mustJump = true;
    }, this);
    this.actionButton.events.onInputUp.add(function(){
      this.player.customParams.mustJump = false;
    }, this);
    this.actionButton.events.onInputOver.add(function(){
      this.player.customParams.mustJump = true;
    }, this);
    this.actionButton.events.onInputOut.add(function(){
      this.player.customParams.mustJump = false;
    }, this);

    //left
    this.leftArrow.events.onInputDown.add(function(){
      this.player.customParams.isMovingLeft = true;
    }, this);
    this.leftArrow.events.onInputUp.add(function(){
      this.player.customParams.isMovingLeft = false;
    }, this);
    this.leftArrow.events.onInputOver.add(function(){
      this.player.customParams.isMovingLeft = true;
    }, this);
    this.leftArrow.events.onInputOut.add(function(){
      this.player.customParams.isMovingLeft = false;
    }, this);

    //right
    this.rightArrow.events.onInputDown.add(function(){
      this.player.customParams.isMovingRight = true;
    }, this);
    this.rightArrow.events.onInputUp.add(function(){
      this.player.customParams.isMovingRight = false;
    }, this);
    this.rightArrow.events.onInputOver.add(function(){
      this.player.customParams.isMovingRight = true;
    }, this);
    this.rightArrow.events.onInputOut.add(function(){
      this.player.customParams.isMovingRight = false;
    }, this);


  },

  update() {

    this.game.physics.arcade.collide(this.player, this.ground, this.landed);
    this.game.physics.arcade.collide(this.player, this.platforms, this.landed);
    this.game.physics.arcade.overlap(this.player, this.fire, this.landed);

    this.player.body.velocity.x = 0;

    if(this.cursors.left.isDown || this.player.customParams.isMovingLeft){
      this.player.body.velocity.x = -this.PLAYER_SPEED;
      this.player.play('walking');
      this.player.scale.x = 1;
    }else if(this.cursors.right.isDown || this.player.customParams.isMovingRight){
      this.player.body.velocity.x = this.PLAYER_SPEED;
      this.player.play('walking');
      this.player.scale.x = -1;
    }else{
      this.player.play('idle');
    }

    if( (this.cursors.up.isDown || this.player.customParams.mustJump) && this.player.body.touching.down) {
      this.player.body.velocity.y = -this.JUMP_SPEED;
    }


  },
  landed(player, ground){
    // console.log('Landed on ' +  ground.key);

  }
  
  
};

//initiate the Phaser framework
var game = new Phaser.Game(360, 592, Phaser.AUTO);

game.state.add('GameState', GameState);
game.state.start('GameState');

