var JumpStack = JumpStack || {};

JumpStack.Block = function(state, x, y, data) {
    Phaser.Sprite.call(this, state.game, x, y, data.asset, data.frame);

    this.state = state;
    this.game = state.game;
    this.anchor.setTo(.5);
};

JumpStack.Block.prototype = Object.create(Phaser.Sprite.prototype);
JumpStack.Block.prototype.constructor = JumpStack.Block;