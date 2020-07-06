var SpaceHipster = SpaceHipster || {};

SpaceHipster.GameState = {

  //initiate game settings
  init: function() {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.PLAYER_SPEED = 200;
    this.BULLET_SPEED = -1000;

  },

  //load the game assets before the game starts
  preload: function() {
    this.load.image('space', 'assets/images/space.png');  
    this.load.image('nebula', 'assets/images/nebula.jpg');  
    this.load.image('starfield', 'assets/images/stars.png');    
    this.load.image('player', 'assets/images/player.png');    
    this.load.image('bullet', 'assets/images/bullet.png');    
    this.load.image('enemyParticle', 'assets/images/enemyParticle.png');    
    this.load.spritesheet('yellowEnemy', 'assets/images/yellow_enemy.png', 50, 46, 3, 1, 1);   
    this.load.spritesheet('redEnemy', 'assets/images/red_enemy.png', 50, 46, 3, 1, 1);   
    this.load.spritesheet('greenEnemy', 'assets/images/green_enemy.png', 50, 46, 3, 1, 1);   

  },
  //executed after everything is loaded
  create: function() {
    this.cursors = this.game.input.keyboard.createCursorKeys();

    this.background = this.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'nebula');
    this.space = this.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'starfield');
    
    this.background.autoScroll(0, 25);
    this.space.autoScroll(0, 15);

    this.player = this.add.sprite(this.game.world.centerX, this.game.world.height - 200, 'player');
    this.game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;
    this.player.anchor.setTo(.5);



    this.stars = this.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'space');
    this.stars.autoScroll(0, 45);
   
  },
  update: function() {

      this.player.body.velocity.x = 0;
      this.player.body.velocity.y = 0;

    if (this.cursors.left.isDown)
    {
      this.background.tilePosition.x += .5;
      this.space.tilePosition.x += .2;
      this.stars.tilePosition.x += 1;

      this.player.body.velocity.x = -this.PLAYER_SPEED;
    }
    else if (this.cursors.right.isDown)
    {
      this.background.tilePosition.x -= .5;
      this.space.tilePosition.x -= .2;
      this.stars.tilePosition.x -= 1;
      this.player.body.velocity.x = this.PLAYER_SPEED;
    }

    if (this.cursors.up.isDown)
    {
      this.background.tilePosition.y += .5;
      this.space.tilePosition.y += .2;
      this.stars.tilePosition.y += 1;
      this.player.body.velocity.y = -this.PLAYER_SPEED / 2;
    }
    else if (this.cursors.down.isDown)
    {
      this.background.tilePosition.y -= .6;
      this.space.tilePosition.y -= .4;
      this.stars.tilePosition.y -= 1.2;
      this.player.body.velocity.y = this.PLAYER_SPEED / 2;
    }
  },

};