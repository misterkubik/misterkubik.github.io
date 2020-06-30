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
    // this.shiftBttn = this.input.keyboard.addKeys(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.game.world.setBounds(0, 0, 360, 700);

    this.PLAYER_SPEED = 120;
    this.RUN_SPEED = 250;
    this.JUMP_SPEED = 550;
  },

  //load the game assets before the game starts
  preload() {
    this.load.image('ground', 'assets/images/ground.png'); 
    this.load.image('background', 'assets/images/background.png');    
    this.load.image('platform', 'assets/images/platform.png');    
    this.load.image('goal', 'assets/images/gorilla3.png');    
    this.load.image('arrowButton', 'assets/images/arrowButton.png');    
    this.load.image('actionButton', 'assets/images/actionButton.png');    
    this.load.image('barrel', 'assets/images/barrel.png');    

    this.load.spritesheet('player', 'assets/images/luigi_spritesheet.png', 34, 56, 10, 0, 0);   
    this.load.spritesheet('pig', 'assets/images/pig.png', 78, 78, 70, 0, 2);    
    this.load.spritesheet('naruto', 'assets/images/naruto.png', 78, 78, 200, 0, 2);    
    this.load.spritesheet('fire', 'assets/images/fire_spritesheet.png', 32, 55, 4, 0, 0);      

    this.load.text('level', 'assets/data/level.json');
  },
  //executed after everything is loaded
  create() {    

    this.background = this.add.sprite(this.game.world.centerX, this.game.world.height, 'background');
    this.background.anchor.setTo(0.5,1);
    this.background.scale.setTo(1.5);

    this.ground = this.add.sprite(this.game.world.centerX, this.game.world.height, 'ground');
    this.ground.anchor.setTo(.5, 1);
    this.game.physics.arcade.enable(this.ground);
    this.ground.body.allowGravity = false;
    this.ground.body.immovable = true;

    //parse file
    this.levelData = JSON.parse(this.game.cache.getText('level'));

    // console.log(this.levelData)

    this.platforms = this.add.group();
    this.platforms.enableBody = true;

    this.levelData.platformData.forEach(item => {
      this.platforms.create(item.x, item.y, 'platform');

    }, this);

    this.platforms.setAll('body.immovable', true);
    this.platforms.setAll('body.allowGravity', false);

    // this.platform = this.add.sprite(0, 300, 'platform');
    // this.game.physics.arcade.enable(this.platform);
    // this.platform.body.allowGravity = false;
    // this.platform.body.immovable = true;


    //fires
    this.fires = this.add.group();
    this.fires.enableBody = true;

    var fire;
    this.levelData.fireData.forEach(item => {
      fire = this.fires.create(item.x, item.y, 'fire', 1);
      fire.animations.add('flame', [0,1,2,3], 8, true, true);
      fire.anchor.setTo(0.5, 0.9);
      fire.scale.setTo(0.7);
      fire.play('flame');
    }, this);

    this.game.physics.arcade.enable(this.fires);
    this.fires.setAll('body.allowGravity', false);
    this.fires.setAll('body.immovable', true);


    //add fire
    // this.fire = this.add.sprite(100, 237, 'fire', 1);
    // this.game.physics.arcade.enable(this.fire);
    // this.fire.body.allowGravity = false;
    // this.fire.body.immovable = true;

    // this.fire.anchor.setTo(0.5, 1);
    // this.fire.scale.setTo(0.7);
    // this.fire.animations.add('flame', [0,1,2,3], 8, true, true);
    // this.fire.play('flame');

    //create player
    // this.player = this.add.sprite(this.levelData.playerStart.x, this.levelData.playerStart.y, 'player', 9);
    var pigChar = this.add.sprite(this.levelData.playerStart.x, this.levelData.playerStart.y, 'pig', 0);
    pigChar.alpha = 0;
    var narutoChar = this.add.sprite(this.levelData.playerStart.x, this.levelData.playerStart.y, 'naruto', 0);
    narutoChar.alpha = 0;

    // this.player.scale.setTo(2);
    // this.player.animations.add('idle', [9], 12, true);
    // this.player.animations.add('walking', [1, 2, 3, 4, 5, 6, 7, 8], 12, true);

    //pig animations
    pigChar.animations.add('idle', [0, 1, 2 , 3], 8, true);
    pigChar.animations.add('walk', [4, 5, 6, 7], 8, true);
    pigChar.animations.add('jumpUp', [34], 12, false);
    pigChar.animations.add('fall', [33], 12, false);
    pigChar.animations.add('burn', [18, 19], 8, true);
    pigChar.bBox = {w: 29, h: 19, x: 37, y: 78};

    //naruto animations
    narutoChar.animations.add('idle', [0, 1, 2 , 3, 4, 5], 12, true);
    narutoChar.animations.add('walk', [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], 20, true);
    narutoChar.animations.add('run', [90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101], 30, true);
    narutoChar.animations.add('jumpUp', [112, 113], 12, false);
    narutoChar.animations.add('fall', [114, 115, 116, 117], 12, false);
    narutoChar.animations.add('burn', [8, 9], 8, true);
    narutoChar.bBox = {w: 23, h: 56, x: 37, y: 72};

    this.player = narutoChar;
    this.player.alpha = 1;

    this.game.physics.arcade.enable(this.player);
    this.player.anchor.setTo(0.5, 1);
    this.player.body.collideWorldBounds = true;
    // this.player.play('walking');
    this.player.customParams = {};


    // this.player.body.sourceWidth = 30;
    // this.player.body.sourceHeight = 22;

    this.player.play('idle');

    console.log(this.player.body);

    this.game.camera.follow(this.player);

    this.createOnscreenControls();


  },

  createOnscreenControls() {
    this.leftArrow = this.add.button(50, 555, 'arrowButton');
    this.leftArrow.anchor.setTo(.5);
    this.rightArrow = this.add.button(150, 555, 'arrowButton');
    this.rightArrow.scale.x = -1;
    this.rightArrow.anchor.setTo(.5);
    this.actionButton = this.add.button(310, 555, 'actionButton');
    this.actionButton.anchor.setTo(.5);

    this.leftArrow.alpha = this.rightArrow.alpha = this.actionButton.alpha = 0.5;

    this.leftArrow.fixedToCamera = this.rightArrow.fixedToCamera = this.actionButton.fixedToCamera = true;

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

  burned() {
    this.player.customParams.isBurning = true;
    this.player.play('burn');
    // this.game.events.add.timer(1000, () => this.player.stop() );
    // console.log('im burning');
  },

  update() {

    this.player.body.setSize(this.player.bBox.w, this.player.bBox.h, this.player.bBox.x * this.player.scale.x - (this.player.width * this.player.anchor.x), this.player.bBox.y - (this.player.height * this.player.anchor.y));

    this.game.physics.arcade.collide(this.player, this.ground, this.landed);
    this.game.physics.arcade.collide(this.player, this.platforms, this.landed);
    // this.game.physics.arcade.overlap(this.player, this.fires, this.burned.bind(this) );
    this.game.physics.arcade.overlap(this.player, this.fires, () => this.burned() );

    this.player.body.velocity.x = 0;

    if(this.cursors.left.isDown || this.player.customParams.isMovingLeft){
      this.player.body.velocity.x = -this.PLAYER_SPEED;
      this.player.play('walk');
      this.player.scale.x = -1;
      // this.player.body.setSize(23, 56, -8, -10);
      this.leftArrow.alpha = 0.3;
      this.leftArrow.scale.setTo(.9);
    }else if(this.cursors.right.isDown || this.player.customParams.isMovingRight){
      this.player.body.velocity.x = this.PLAYER_SPEED;
      this.player.play('walk');
      this.player.scale.x = 1;
      // this.player.body.setSize(23, 56, 11, -10);
      this.rightArrow.alpha = 0.3;
      this.rightArrow.scale.setTo(-.9,.9);
    }else if(this.player.customParams.isFalling){
      this.player.play('fall');
    }else if(this.player.customParams.isJumping){
      this.player.play('jumpUp');
    }else{
      this.leftArrow.alpha = 0.6;
      this.rightArrow.alpha = 0.6;
      this.leftArrow.scale.setTo(1);
      this.rightArrow.scale.setTo(-1,1);
      this.player.play('idle');
      // this.player.animations.stop();
      // this.player.frame = 9;
    }

    

    if( (this.cursors.up.isDown || this.player.customParams.mustJump) && this.player.body.touching.down) {
      this.player.body.velocity.y = -this.JUMP_SPEED;
      // this.player.customParams.isJumping = true;
      // this.player.play('jumpUp');
    }else if ( !this.player.body.touching.down){
      if(this.player.body.velocity.y > 0){
        // this.player.customParams.isFalling = true;
      }
    }
    if(this.player.body.touching.down){
      // this.player.customParams.isFalling = false;
      // this.player.customParams.isJumping = false;
    }


    console.log(this.player.animations.currentAnim.name);

    if( (this.cursors.up.isDown || this.player.customParams.mustJump)) {
      this.actionButton.alpha = 0.3;
      this.actionButton.scale.setTo(.9);
    }else if ( !this.player.body.touching.down){
      this.actionButton.alpha = 0.6;
      this.actionButton.scale.setTo(1);
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

