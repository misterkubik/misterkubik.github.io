var JumpStack = JumpStack || {};

JumpStack.Player = function(state, x, y, data){
    this.state = state;
    this.game = state.game;
    this.isPlayerAlive = true;
    this.isPlayerJump = true;
    this.animState = data.state || 'idle';

    Phaser.Sprite.call(this, this.game, x, y, data.asset, data.frame);

    this.animations.add('idle', ['hero_jump_01'], 12, true);
    this.animations.add('jump', ['hero_jump_01','hero_jump_02',
                                'hero_jump_03','hero_jump_04',
                                'hero_jump_05'], 12, false);

    this.animations.add('fall', ['hero_jump_06',
                                'hero_jump_07','hero_jump_08',
                                'hero_jump_09','hero_jump_10'], 12, true);
    
    this.play(this.animState);

    this.anchor.setTo(.5);
    this.game.physics.arcade.enable(this);
    this.body.immovable = false;
    this.body.allowGravity = true;
    this.body.gravity.y = 1000;
    this.body.bounce.y = .2;
    this.bringToTop();
    this.body.setSize(90, 90, 20, 30);
    this.body.checkCollision.up = false;
};

JumpStack.Player.prototype = Object.create(Phaser.Sprite.prototype);
JumpStack.Player.prototype.constructor = JumpStack.Player;

JumpStack.Player.prototype.update = function() {

    if(this.body.wasTouching.left || this.body.wasTouching.right){
        this.isPlayerAlive = false;
        this.body.immovable = true;
        this.body.allowGravity = false;
    }

};

JumpStack.Player.prototype.jump = function() {

    if(this.isPlayerJump){
    }else{
        this.body.velocity.y = -700;
        this.isPlayerJump = true;
        this.play('jump');
        // if(this.body.deltaY > 0){
        //     this.play('fall');
        // }
    }

};
