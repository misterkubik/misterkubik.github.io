var SpaceHipster = SpaceHipster || {};

SpaceHipster.EnemyBullet = function(game, x, y){
    Phaser.Sprite.call(this, game,x, y, 'enemyBeam');

    this.animations.add('fly', [0,1,2,3], 20, true);
    this.play('fly');

    this.anchor.setTo(0.5);
    this.scale.setTo(.4);
    
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;
};

SpaceHipster.EnemyBullet.prototype = Object.create(Phaser.Sprite.prototype);
SpaceHipster.EnemyBullet.prototype.constructor = SpaceHipster.EnemyBullet;