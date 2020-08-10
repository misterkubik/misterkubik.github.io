var JumpStack = JumpStack || {};

JumpStack.Player = function(state, x, y, data){
    this.state = state;
    this.game = state.game;
    this.isPlayerAlive = true;
    this.isPlayerJump = true;
    this.animState = data.state || 'lose';

    Phaser.Sprite.call(this, this.game, x, y, data.asset, data.frame);


    var idle = this.animations.add('idle', ['frog_idle_00', 'frog_idle_00'], 25, true);

    var idle1 = this.animations.add('idle1', geterateAnimationList(0, 30, 'frog_idle_'), 25, true);
    var idle2 = this.animations.add('idle2', genAnimListFromFrameToFrame([0, 12, 0], 'frog_idle2_'), 25, true);
    var idle3 = this.animations.add('idle3', genAnimListFromFrameToFrame([32, 21, 32], 'frog_idle2_'), 25, true);
    var idle4 = this.animations.add('idle4', geterateAnimationList(0, 32, 'frog_idle2_'), 25, true);


    idle.delay = 100;
    idle.onLoop.add(() => {
        var idleState;
        if(this.state.blocks.blocksAlive){
            idleState = this.state.blocks.blocksAlive.direction < 0 ? idle2 : idle3;
        }else{
            idleState = Math.random > .7 ? idle1 : idle4;
        }
        idleState.play();
    });

    idle1.onLoop.add(() => idle.play());
    idle2.onLoop.add(() => idle.play());
    idle3.onLoop.add(() => idle.play());
    idle4.onLoop.add(() => idle.play());


    this.animations.add('jump', geterateAnimationList(10, 25, 'frog_jump_'), 30, false);
    this.animations.add('jump2', geterateAnimationList(10, 25, 'frog_jump2_'), 30, false);
    this.animations.add('jump3', geterateAnimationList(10, 24, 'frog_jump3_'), 25, false);

    // var readyAnim = this.animations.add('ready', geterateAnimationList(0, 9, 'frog_jump_') , 25, false);
    // var wiggleAnim = this.animations.add('wiggle', geterateAnimationListFromArray([8,7,6,5,6,7,8,9], 'frog_jump_') , 25, true);

    // readyAnim.onComplete.add(() => wiggleAnim.play());

    var landAnim = this.animations.add('land', geterateAnimationList(26, 44, 'frog_jump3_'), 25, false);

    // var landAnim3 = this.animations.add('land3', geterateAnimationList(26, 48, 'frog_jump_'), 25, false);

    landAnim.onComplete.add(() => idle.play());

    // this.animations.add('fall', geterateAnimationList(16, 48, 'frog_jump_'), 30, true);

    this.animations.add('lose', geterateAnimationList(0, 15, 'frog_lose_'), 25, false);
    
    this.play(this.animState);

    this.anchor.setTo(.5);
    this.game.physics.arcade.enable(this);
    this.body.immovable = false;
    this.body.allowGravity = true;
    this.body.gravity.y = 1400;
    this.body.bounce.y = .2;
    this.bringToTop();
    this.body.setSize(60, 145, 78, 87);
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

function geterateAnimationList(inValue, outValue, name){
    var arr = [];
    for(var i = inValue; ((inValue < outValue) ? i <= outValue : i >= outValue); ((inValue < outValue) ? i++ : i--)){
        arr.push(name + addZero(i, 2));
    }
    return arr;
}
function geterateAnimationListFromArray(arr, name){
    return arr.map(item => name + addZero(item, 2));
}
function genAnimListFromFrameToFrame(arr, name){
    var outputArr = [];
    for(var i = 0; i < arr.length - 1; i++){
        outputArr = outputArr.concat(geterateAnimationList(arr[i], arr[i+1], name));
    }
    return outputArr;
}

function addZero(num, chars){
    var chars = chars || 2;
    var str = num + '';
    if (str.length < chars){
        str = addZero('0' + str, chars);
    }else{
        return str;
    }
    return str;
}

JumpStack.Player.prototype.jump = function() {

    if(this.isPlayerJump){
    }else{
        this.body.velocity.y = -700;
        this.isPlayerJump = true;
        if(this.state.blocks.blocksAlive){
            var jumpType = this.state.blocks.blocksAlive.direction < 0 ? 'jump' : 'jump2';
            this.jumpType = (this.jumpType === jumpType) ? 'jump3' : jumpType;
        }else{
            this.jumpType = 'jump3';
        }
        this.play(this.jumpType);
        // if(this.body.deltaY > 0){
        //     this.play('fall');
        // }
    }

};
