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

    this.player = this.add.sprite(this.game.world.centerX, this.game.world.height - 100, 'player');
    this.player.anchor.setTo(.5);
    this.game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;

    this.stars = this.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'space');
    this.stars.autoScroll(0, 45);

    this.initBullets();   
    this.shootingTimer = this.game.time.events.loop(Phaser.Timer.SECOND / 5, this.createPlayerBullets, this);
  },
  update: function() {

    // console.log(this.playerBullets.children.length);

      this.player.body.velocity.x = 0;
      this.player.body.velocity.y = 0;


    if(this.game.input.activePointer.isDown || this.cursors.left.isDown || this.cursors.right.isDown)
    {
      var direction;
      if(this.game.input.activePointer.isDown)
      {
        var targetX = this.game.input.activePointer.position.x;
        direction = targetX >= this.game.world.centerX ? 1 : -1;
      }else{
        direction = this.cursors.right.isDown ? 1 : -1;
      }

        this.player.body.velocity.x = direction * this.PLAYER_SPEED;
        this.background.tilePosition.x += .5 * -direction;
        this.space.tilePosition.x += .2 * -direction;
        this.stars.tilePosition.x += 1 * -direction;
    }

  },

  initBullets: function(){
    this.playerBullets = this.add.group();
    this.playerBullets.enableBody = true;
  },

  createPlayerBullets: function(){
    var bullet = this.playerBullets.getFirstExists(false);
    if(!bullet)
    {
      bullet = new SpaceHipster.PlayerBullet(this.game, this.player.x, this.player.top);
      this.playerBullets.add(bullet);
    }else{
      //reset position
      bullet.reset(this.player.x, this.player.top);
    }
    //set some velocity
    bullet.body.velocity.y = this.BULLET_SPEED;


  },

};