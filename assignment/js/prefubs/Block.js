var JumpStack = JumpStack || {};

JumpStack.Block = function(state, x, y, data) {
    this.state = state;
    this.game = state.game;
    this.direction = data.dir || 0;
    this.fruitList = this.game.cache.getFrameData('Fruits')._frames;
    var frameName = this.fruitList[Math.floor( Math.random() * this.fruitList.length)].name;

    Phaser.Sprite.call(this, this.game, x, y, data.asset, frameName);

    this.anchor.setTo(.5);
    this.game.physics.arcade.enable(this);
    this.body.immovable = true;
    this.body.allowGravity = false;
    this.body.setSize(172, 40, 35, 30);
    this.body.blocked.up = true;
    this.body.blocked.down = true;
    // this.body.stopVelocityOnCollide = true;
    // this.body.velocity.x = 200 * this.direction;
    // this.game.physics.arcade.moveToXY(this, this.game.world.centerX, this.y, 200, this.state.DEFAULT_SPEED);
    
    this.blockMove = this.game.add.tween(this);
    this.blockMove.to({x: this.game.world.centerX }, this.state.DEFAULT_SPEED, Phaser.Easing.Cubic.In);

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

    if(this.direction){
        this.blockMove.start();
    }
    this.bringToTop();
}
