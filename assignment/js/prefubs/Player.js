var JumpStack = JumpStack || {};

JumpStack.Player = function(state, x, y, data){
    this.state = state;
    this.game = state.game;
    this.isPlayerAlive = true;
    this.isPlayerJump = true;
    this.animState = data.state || 'idle';
    Phaser.Sprite.call(this, this.game, x, y, data.asset, data.frame);

    this.anchor.setTo(.5);
    this.game.physics.arcade.enable(this);
    this.body.immovable = false;
    this.body.allowGravity = true;
    this.body.gravity.y = 1000;
    this.body.bounce.y = .2;
    this.bringToTop();
    this.body.setSize(90, 90, 20, 24);
    this.body.checkCollision.up = false;
};

JumpStack.Player.prototype = Object.create(Phaser.Sprite.prototype);
JumpStack.Player.prototype.constructor = JumpStack.Player;

JumpStack.Player.prototype.update = function() {

    // this.body.onCollide = 

    // if(this.body.checkCollision.left || this.body.checkCollision.right){
    //     this.body.enable = false;
    // }
};
