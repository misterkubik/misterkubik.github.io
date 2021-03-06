var SpaceHipster = SpaceHipster || {};

SpaceHipster.GameState = {

  //initiate game settings
  init: function(currentLevel) {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.PLAYER_SPEED = 200;
    this.BULLET_SPEED = -1000;
    this.RED_ENEMY_SPEED = {x: 100, y: 50};

    //level data
    this.numLevels = 3;
    this.currentLevel = currentLevel || 1;
    // console.log('LEVEL: ' + this.currentLevel);

  },

  //load the game assets before the game starts
  preload: function() {
    this.load.image('space', 'assets/images/space.png');  
    this.load.image('nebula', 'assets/images/nebula.jpg');  
    this.load.image('starfield', 'assets/images/stars.png');    
    this.load.image('player', 'assets/images/player.png');    
    this.load.image('bullet', 'assets/images/bullet.png');  
    this.load.image('beam', 'assets/images/beam.png');   
    this.load.image('enemyBeam', 'assets/images/enemyBeam.png');    
    this.load.image('enemyParticle', 'assets/images/enemyParticle.png'); 
    this.load.image('beamsParticle', 'assets/images/beamsParticle.png');  
    this.load.image('redParticle', 'assets/images/redParticle.png');   
    this.load.image('greenParticle', 'assets/images/greenParticle.png');   
    this.load.image('yellowParticle', 'assets/images/yellowParticle.png');    
    this.load.spritesheet('yellowEnemy', 'assets/images/yellow_enemy.png', 50, 46, 3, 1, 2);   
    this.load.spritesheet('redEnemy', 'assets/images/red_enemy.png', 50, 46, 3, 1, 2);   
    this.load.spritesheet('greenEnemy', 'assets/images/green_enemy.png', 50, 46, 3, 1, 2);   
    this.load.spritesheet('beams', 'assets/images/beams.png', 100, 250, 4, 0, 0);   

    //load level data JSON file
    this.load.text('level1', 'assets/data/level1.json');
    this.load.text('level2', 'assets/data/level2.json');
    this.load.text('level3', 'assets/data/level3.json');

    //load audio soundtrack files
    this.load.audio('ost', 'assets/audio/soundtrack.mp3', 'assets/audio/soundtrack.ogg');
  },
  //executed after everything is loaded
  create: function() {
    this.cursors = this.game.input.keyboard.createCursorKeys();

    this.soundtrack = this.add.audio('ost');

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

    this.initEnemies();

    //load level
    this.loadLevel();

    this.soundtrack.play();

    this.textStyle = {fill: '#FFFFFF', font: 'bold Square721 BT', fontSize: '48px', align: 'center', };
    this.levelText = this.add.text(this.game.world.centerX, this.game.world.centerY, 'LEVEL: ' + this.currentLevel, this.textStyle);
    this.levelText.anchor.setTo(0.5);
    this.textFadeOutTween = this.game.add.tween(this.levelText);
    this.textFadeOutTween.to({alpha: 0}, 1000);
    this.textFadeOutTween.delay(1000);
    this.textFadeOutTween.start();

  },
  update: function() {

    // console.log(this.playerBullets.children.length);

    this.game.physics.arcade.overlap(this.playerBullets, this.enemies, this.damageEnemy, null, this);
    this.game.physics.arcade.overlap(this.enemyBullets, this.player, this.damagePlayer, null, this);

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

  initEnemies: function(){
    this.enemies = this.add.group();
    this.enemies.enableBody = true;

    this.enemyBullets = this.add.group();
    this.enemyBullets.enableBody = true;

  },

  damageEnemy: function(bullet, enemy){
    enemy.damage(10);

    this.emitter = this.game.add.emitter(bullet.x, bullet.top, 5);
    var particleName = ('beamsParticle');
    var ptxLife = 850;
    this.emitter.makeParticles(particleName);

    this.emitter.minRotation = -15;
    this.emitter.maxRotation = 15;
    this.emitter.minParticleScale = .2;
    this.emitter.maxParticleScale = 1;
    this.emitter.minParticleSpeed.setTo(-50, -20);
    this.emitter.maxParticleSpeed.setTo(50, 200);
    this.emitter.gravity = -300;
    this.emitter.drag = 2000;
    this.emitter.start(true, ptxLife, null, 5);

    this.emitter.children.forEach((ptx) => {
      var tweenScale = ptx.game.add.tween(ptx.scale);
      var tweenAlpha = ptx.game.add.tween(ptx);
      tweenScale.to({ x: 0, y: 0 }, ptxLife);
      tweenAlpha.to({ alpha: 0 }, ptxLife);
      tweenScale.start();
      tweenAlpha.start();

      // var scaleData = [{x: 1, y: 1}, {x: 3, y: 3}, {x: 2, y: 2}, {x: 0, y: 0}];
      // var alphaData = [1, 1, 0, 0, .9, 0.3, .6, 0];

      // ptx.setScaleData(scaleData);
      // ptx.setAlphaData(alphaData);

      // ptx.autoScale = true;
      // ptx.autoAlpha = true;

    }, this.emitter);

    bullet.kill();
  },

  damagePlayer(bullet, player){
    var emitter = this.game.add.emitter(player.x, player.y, 100);
    var particleName = ('enemyParticle');
    var ptxLife = 500;
    emitter.makeParticles(particleName);

    emitter.minRotation = -5;
    emitter.maxRotation = 5;
    emitter.minParticleScale = 1;
    emitter.maxParticleScale = 10;
    emitter.minParticleSpeed.setTo(-200, -50);
    emitter.maxParticleSpeed.setTo(200, 300);
    emitter.gravity = 300;
    emitter.start(true, ptxLife, null, 100);

    emitter.children.forEach((ptx) => {
      var tweenScale = ptx.game.add.tween(ptx.scale);
      var tweenAlpha = ptx.game.add.tween(ptx);
      tweenScale.to({ x: 0, y: 0 }, ptxLife);
      tweenAlpha.to({ alpha: 0 }, ptxLife);
      tweenScale.start();
      tweenAlpha.start();
  }, emitter);

    this.player.kill();
    bullet.kill();
    this.shootingTimer.loop = false;



    this.gameOver('GAME OVER', 1);
  },

  gameOver(str, level){
    this.levelText.text = str;
    this.levelText.alpha = 0;
    this.textFadeOutTween.to({alpha: 1}, 1000);
    this.textFadeOutTween.delay(0);
    this.textFadeOutTween.onComplete.add(() => {
      this.soundtrack.stop();
      this.game.state.start('GameState', true, false, level);
    }, this);
    this.textFadeOutTween.start();
  },

  createEnemy(x, y, health, key, scale, speedX, speedY, shootSpeed){
    var enemy = this.enemies.getFirstExists(false);
    if(!enemy)
    {
      enemy = new SpaceHipster.Enemy(this.game, x, y, key, health, this.enemyBullets, shootSpeed);
      this.enemies.add(enemy);
    }

    enemy.reset(x, y, health, key, scale, speedX, speedY, shootSpeed);
  },

  loadLevel: function(){
    this.currentEnemyIndex = 0;

    this.levelData = JSON.parse(this.game.cache.getText('level' + this.currentLevel));

    this.endOfLevelTimer = this.game.time.events.add(this.levelData.duration * 1000, function(){
      // console.log('LEVEL ENDED');

      this.soundtrack.play();

      if(this.currentLevel < this.numLevels)
      {
        this.currentLevel++;
      }else{
        this.currentLevel = 1;
      }

      // this.game.state.start('GameState', true, false, this.currentLevel);
      this.gameOver('LEVEL COMPLETE', this.currentLevel);
    }, this);

    this.scheduleNextEnemy();
  },

  scheduleNextEnemy: function(){
    var nextEnemy = this.levelData.enemies[this.currentEnemyIndex];

    if(nextEnemy)
    {
      var nextTime = 1000 * (nextEnemy.time - (this.currentEnemyIndex == 0 ? 0 : this.levelData.enemies[this.currentEnemyIndex - 1].time));
    
      this.nextEnemyTimer = this.game.time.events.add(nextTime, function(){
        this.createEnemy(nextEnemy.x * this.game.world.width, -50, nextEnemy.health * 10, nextEnemy.key, nextEnemy.scale, nextEnemy.speedX, nextEnemy.speedY, nextEnemy.bulletSpeed || 200);
        this.currentEnemyIndex++;
        this.scheduleNextEnemy();
      }, this);
    }

  },

};