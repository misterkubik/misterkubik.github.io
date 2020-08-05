var JumpStack = JumpStack || {};

JumpStack.Block = function(state, x, y, data) {
    this.state = state;
    this.game = state.game;
    this.direction = data.dir || 0;
    this.speed = data.speed || 50;

    Phaser.Sprite.call(this, state.game, x, y, data.asset, data.frame);

    this.anchor.setTo(.5);
    this.game.physics.arcade.enable(this);
    this.body.setSize(this.width, this.height - 12, 0, 2);
    this.body.velocity.x = this.speed * this.direction;
};

JumpStack.Block.prototype = Object.create(Phaser.Sprite.prototype);
JumpStack.Block.prototype.constructor = JumpStack.Block;


JumpStack.Block.prototype.update = function(){

    if(this.direction > 0 && this.x > 0.95 * this.game.world.width)
    {
        this.x = 0.95 * this.game.world.width - 2;
        this.body.velocity.x *= -this.state.BOUNCE_BOOSTER;
        this.direction = -1;
    }else if(this.direction < 0 && this.x < 0.05 * this.game.world.width){
        this.x = 0.05 * this.game.world.width + 2;
        this.body.velocity.x *= -this.state.BOUNCE_BOOSTER;
        this.direction = 1;
    }
};
