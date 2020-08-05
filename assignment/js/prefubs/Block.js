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
    this.body.setSize(this.width, this.height - 12, 0, 2);
    
    this.blockMove = this.game.add.tween(this);
    this.blockMove.to({x: this.game.world.centerX + 20 * this.direction }, this.state.DEFAULT_SPEED, Phaser.Easing.Cubic.In)
    .to({x: this.game.world.centerX - 10 * this.direction }, this.state.DEFAULT_SPEED / 3, Phaser.Easing.Cubic.Out)
    .to({x: this.game.world.centerX + 5 * this.direction }, this.state.DEFAULT_SPEED / 3, Phaser.Easing.Cubic.In)
    .to({x: this.game.world.centerX }, this.state.DEFAULT_SPEED / 4, Phaser.Easing.Cubic.Out);

    
    this.blockScale = this.game.add.tween(this.scale);
    this.blockScale.delay(100)
    .to({x: .95 }, this.state.DEFAULT_SPEED, Phaser.Easing.Cubic.Out)
    .to({x: 1.01 }, this.state.DEFAULT_SPEED / 3, Phaser.Easing.Cubic.In)
    .to({x: 1 }, this.state.DEFAULT_SPEED / 4, Phaser.Easing.Cubic.Out);

    if(this.direction){
        this.blockMove.start();
        this.blockScale.start();
    }
};

JumpStack.Block.prototype = Object.create(Phaser.Sprite.prototype);
JumpStack.Block.prototype.constructor = JumpStack.Block;

JumpStack.Block.prototype.reset = function(x, y, data){
    this.direction = data.dir || 0;
    Phaser.Sprite.prototype.reset.call(this, x, y);
    this.loadTexture(data.asset, data.frame);

    this.blockMove = this.game.add.tween(this);
    this.blockMove.to({x: this.game.world.centerX + 50 * this.direction }, this.state.DEFAULT_SPEED)
    .to({x: this.game.world.centerX }, this.state.DEFAULT_SPEED / 4);

    if(this.direction){
        this.blockMove.start();
    }
    this.bringToTop();
}
