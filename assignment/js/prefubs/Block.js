var JumpStack = JumpStack || {};

JumpStack.Block = function(state, x, y, data) {
    this.state = state;
    this.game = state.game;
    this.direction = data.dir || 0;

    Phaser.Sprite.call(this, this.game, x, y, data.asset, data.frame);

    this.anchor.setTo(.5);
    this.game.physics.arcade.enable(this);
    this.body.immovable = true;
    this.body.allowGravity = false;
    this.body.setSize(172, 38, 35, 30);
    this.body.blocked.up = true;
    this.body.blocked.down = true;

    this.blockMove = this.game.add.tween(this);
    this.blockMove.to({x: this.game.world.centerX }, this.state.DEFAULT_SPEED, Phaser.Easing.Cubic.In);
    this.blockMove.delay(0);

    if(this.direction){
        this.blockMove.start();
    }

    return this;
};

JumpStack.Block.prototype = Object.create(Phaser.Sprite.prototype);
JumpStack.Block.prototype.constructor = JumpStack.Block;

JumpStack.Block.prototype.reset = function(x, y, data){
    this.direction = data.dir || 0;
    Phaser.Sprite.prototype.reset.call(this, x, y);
    this.loadTexture(data.asset, data.frame);

    this.blockMove = this.game.add.tween(this);
    this.blockMove.to({x: this.game.world.centerX }, this.state.DEFAULT_SPEED, Phaser.Easing.Cubic.In);
    this.blockMove.frameBased = true;

    if(this.direction){
        this.blockMove.start();
    }
    this.bringToTop();
}
