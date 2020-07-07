var SpaceHipster = SpaceHipster || {};

SpaceHipster.PlayerBullet = function(game, x, y){
    Phaser.Sprite.call(this, game,x, y, 'beam');

    this.animations.add('fly', [0,1,2,3], 20, true);
    this.play('fly');

    

    this.anchor.setTo(0.5);
    this.scale.setTo(.6);
    this.checkWorldBounds = true;
    this.outOfBoundsKill = true;
};

SpaceHipster.PlayerBullet.prototype = Object.create(Phaser.Sprite.prototype);
SpaceHipster.PlayerBullet.prototype.constructor = SpaceHipster.PlayerBullet;