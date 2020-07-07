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
        var emitter = this.game.add.emitter(this.x, this.bottom, 25 * this.scale.x);
        var particleName = this.key.replace('Enemy','Particle');
        emitter.makeParticles(particleName);
        emitter.minParticleSpeed.setTo(-100 * this.scale.x, -200 * this.scale.y);
        emitter.maxParticleSpeed.setTo(100 * this.scale.x, 10 * this.scale.y);
        emitter.gravity = -100;
        emitter.start(true, 500, null, 25 * this.scale.x);

        this.enemyTimer.pause();
        this.play('dead');
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

