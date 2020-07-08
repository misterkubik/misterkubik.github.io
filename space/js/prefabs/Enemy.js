var SpaceHipster = SpaceHipster || {};
SpaceHipster.Enemy = function(game, x, y, key, health, enemyBullets, bulletSpeed){
    Phaser.Sprite.call(this, game, x, y, key);
    this.game = game;

    // this.game.physics.arcade.enable(this);

    this.animations.add('hit', [0, 1, 2, 2, 1, 0], 25, false);
    this.animations.add('dead', [0, 1, 2, 2], 5, false);
    this.anchor.setTo(.5);
    this.health = health;
    this.bulletSpeed = bulletSpeed;

    this.enemyBullets = enemyBullets;
    this.enemyTimer = this.game.time.create(false);
    this.enemyTimer.start();

    this.sheduleShooting();
};
SpaceHipster.Enemy.prototype = Object.create(Phaser.Sprite.prototype);
SpaceHipster.Enemy.prototype.constructor = SpaceHipster.Enemy;

SpaceHipster.Enemy.prototype.update = function(){
    if(this.x < 0.05 * this.game.world.width)
    {
        this.x = 0.05 * this.game.world.width + 2;
        this.body.velocity.x *= -1;
    }else if(this.x > 0.95 * this.game.world.width){
        this.x = 0.95 * this.game.world.width - 2;
        this.body.velocity.x *= -1;
    }
};

SpaceHipster.Enemy.prototype.damage = function(amount){
    Phaser.Sprite.prototype.damage.call(this, amount);
    //play animation
    this.play('hit');

    //particle explosion
    if(this.health <= 0)
    {
        var emitter = this.game.add.emitter(this.x, this.bottom, 50 * this.scale.x);
        var particleName = this.key.replace('Enemy','Particle');
        var ptxLife = 500;
        emitter.makeParticles(particleName);
        emitter.minRotation = -5;
        emitter.maxRotation = 5;
        emitter.minParticleScale = .5 * this.scale.y;
        emitter.maxParticleScale = 5 * this.scale.y;
        emitter.minParticleSpeed.setTo(-70 * this.scale.x, -175 * this.scale.y);
        emitter.maxParticleSpeed.setTo(70 * this.scale.x, 20 * this.scale.y);
        emitter.gravity = -200;
        emitter.start(true, ptxLife, null, 50 * this.scale.x);

        emitter.children.forEach((ptx) => {
            var tweenScale = ptx.game.add.tween(ptx.scale);
            var tweenAlpha = ptx.game.add.tween(ptx);
            tweenScale.to({ x: 0, y: 0 }, ptxLife);
            tweenAlpha.to({ alpha: 0 }, ptxLife);
            tweenScale.start();
            tweenAlpha.start();
        }, emitter);

        this.enemyTimer.pause();
        this.play('dead');


      if(SpaceHipster.GameState.currentEnemyIndex == SpaceHipster.GameState.levelData.enemies.length && SpaceHipster.GameState.enemies.countLiving() == 0)
      {
        SpaceHipster.GameState.time.events.add(2000, function(){
            if(this.currentLevel < this.numLevels)
            {
              this.currentLevel++;
            }else{
              this.currentLevel = 1;
            }
            SpaceHipster.GameState.gameOver('LEVEL\nCOMPLETE', this.currentLevel);
            // this.game.state.start('GameState', true, false, this.currentLevel);
        }, SpaceHipster.GameState);
      }

    }
};

SpaceHipster.Enemy.prototype.reset = function(x,y, health, key, scale, speedX, speedY, bulletSpeed){
    Phaser.Sprite.prototype.reset.call(this, x, y, health);

    this.loadTexture(key);
    this.scale.setTo(scale);
    this.body.velocity.x = speedX;
    this.body.velocity.y = speedY;

    this.enemyTimer.resume();
    this.bulletSpeed = bulletSpeed;
};

SpaceHipster.Enemy.prototype.sheduleShooting = function() {
    this.shoot(this.bulletSpeed);

    this.enemyTimer.add(Phaser.Timer.SECOND * 2, this.sheduleShooting, this);
};

SpaceHipster.Enemy.prototype.shoot = function(bulletSpeed){
    var bullet = this.enemyBullets.getFirstExists(false);
    if(!bullet)
    {
        bullet = new SpaceHipster.EnemyBullet(this.game, this.x, this.bottom);
        this.enemyBullets.add(bullet);
    }else{
        bullet.reset(this.x, this.bottom);
    }

    bullet.body.velocity.y = bulletSpeed;
};

