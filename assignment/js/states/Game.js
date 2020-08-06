var JumpStack = JumpStack || {};

JumpStack.GameState = {
    create() {
        this.DEFAULT_SPEED = 2000;
        this.REPEAT_BLOCKS = 3;
        this.BOUNCE_BOOSTER = 1.05;
        this.BLOCKS_DELAY_MIN = 50;
        this.BLOCKS_DELAY_MAX = 500;
        this.introPhase = true;
        var worldCenter = {x: this.game.world.centerX, y: this.game.world.centerY};
        this.background = this.game.add.tileSprite(0, -Phaser.DOM.layoutBounds.height / 3, this.game.world.width, Phaser.DOM.layoutBounds.height * 1.5, 'GameAtlas', 'bg');
        this.background.tileScale.setTo(this.background.height / this.background._frame.height);
        this.background.fixedToCamera = true;


        this.ground = this.game.add.sprite(this.game.world.centerX, this.game.world.height, 'GameAtlas', 'platform_01');
        this.ground.anchor.setTo(.5,1);

        this.blocks = this.game.add.group();
        this.blocks.numBlocks = 0;
        this.blocks.enableBody = true;

        var block = this.createMovingBlock(true);
        block.y = this.game.world.height - 80;

        this.blocks.towerHeight = this.getTowerHeight(this.blocks);
        this.blocks.blocksAlive = null;

        var playerSpawn = {x: worldCenter.x, y: this.game.world.height - Phaser.DOM.documentBounds.height / 1.5 };

        this.player = new JumpStack.Player(this, playerSpawn.x, playerSpawn.y, {asset: 'GameAtlas', frame: 'hero_jump_10'});

        this.game.add.existing(this.player);

        this.game.input.onDown.add(this.heroJump, this);

        this.overlay = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'GameAtlas', 'bg_small');
        this.overlay.tileScale.setTo(this.overlay.height / this.overlay._frame.height);
        this.overlay.fixedToCamera = true;
        this.overlay.alpha = 0;

        var textStyle = {fill: '#fff', font: 'bold 50px Arial', strokeThickness: 6};

        this.score = 0;

        this.scoreText = this.game.add.text(worldCenter.x, worldCenter.y, this.score, textStyle);

        this.scoreText.anchor.setTo(.5);
        this.scoreText.fixedToCamera = true;
        this.scoreText.cameraOffset.y = 50;

        this.introText = this.game.add.text(worldCenter.x, 0, 'Tap to play', textStyle);

        this.introText.anchor.setTo(.5);
        this.introText.fixedToCamera = true;
        this.introText.cameraOffset.y = Phaser.DOM.documentBounds.height / 2.3;



    },

    getTowerHeight(group) {
        let height = group.children[group.children.length-1].y;

        return height;
    },

    heroJump() {
        if(this.introPhase){
            this.introPhase = false;
            var fadeOutText = this.game.add.tween(this.introText);
            fadeOutText.to({alpha: 0}, 200)
            .onComplete.add(() => this.createMovingBlock(), this);
            fadeOutText.killOnComplete = true;
            fadeOutText.start();

            // this.game.time.events.add(200, this.createMovingBlock, this);

            return;
        }

        if(!this.player.isPlayerAlive){
            if(this.gameOver){
                this.state.start('Game');
            }
            return;
        }

        this.player.jump();

    },

    playerHit(player, block) {
        block.blockMove.stop();
        // console.log(block.body.wasTouching.down);
        // return;

        if( player.body.bottom > block.body.top ) {
            this.blocks.blocksAlive = null;
            player.isPlayerAlive = null;
            player.body.velocity.y = -500;
            player.body.velocity.x = 20 * block.direction;
            this.blocks.forEach(item => {
                item.body.enable = false;
            }, this);

            this.game.camera.shake(.02,200, true, Phaser.Camera.SHAKE_HORIZONTAL );
            this.game.camera.flash(0xffffff, 200);
            var fadeOutTween = this.game.add.tween(this.overlay);

            fadeOutTween.to({alpha: .95}, 1000, Phaser.Easing.Cubic.Out)
            .delay(500)
            .onComplete.add(() => {
                this.gameOver = true;
            }, this);

            fadeOutTween.start();

            // player.body.stopMovement(true);
            // player.body.velocity.setTo(0);
            // player.body.immovable = false;
            // player.body.allowGravity = true;
            player.isPlayerJump = true;


            var emitter = this.game.add.emitter(player.x, player.y, 50);
            emitter.width = player.body.width - 40;
            var eVel = 30;
            var eLife = 750;
            emitter.makeParticles('GameAtlas', 'star');

            emitter.minParticleSpeed.setTo(eVel * 3 * block.direction, -eVel * 20);
            emitter.maxParticleSpeed.setTo(eVel * block.direction, -eVel * 5);
            
            emitter.maxParticleScale = 1;
            emitter.minParticleScale = .2;

            emitter.maxParticleAlpha = .9;
            emitter.minParticleAlpha = .2;

            emitter.gravity = 500;

            emitter.start(true, eLife, null, 5);

            emitter.children.forEach((ptx) => {
                var tweenScale = ptx.game.add.tween(ptx.scale);
                var tweenAlpha = ptx.game.add.tween(ptx);

                tweenScale.to({ x: 0, y: 0 }, eLife/1.5)
                .delay(eLife / 3);
                tweenAlpha.to({ alpha: 1 }, eLife/3)
                .to({ alpha: 0 }, eLife/1.5);

                tweenScale.start();
                tweenAlpha.start();
            }, emitter);


        }else{
            player.isPlayerJump = false;
            this.blocks.towerHeight = block.y;
            this.blocks.blocksAlive = null;
            if(this.player.isPlayerAlive){
                var newBlockDealy = Math.max(this.BLOCKS_DELAY_MIN,Math.random() * this.BLOCKS_DELAY_MAX);
                this.game.time.events.add(newBlockDealy, this.createMovingBlock, this);
            } 

            var perfectDist = Math.abs(block.centerX - this.game.world.centerX);
            var perfectBlock = 0;
            this.score++;
            this.scoreText.text = this.score;

            switch (true){
                case perfectDist < 5:
                    perfectBlock = 0;
                    break;
                case perfectDist < 20:
                    perfectBlock = 1;
                    break;
                case perfectDist < 30:
                    perfectBlock = 2;
                    break;
                case perfectDist < 50:
                    perfectBlock = 3;
                    break;
                case perfectDist < 100:
                    perfectBlock = 4;
                    break;
                default:
                    perfectBlock = 4;
            }

            var perfectText = 'Perfect!';

            switch (perfectBlock) {
                case 0:
                perfectText = 'Perfect!';
                break;  

                case 1:
                perfectText = 'Nice!';
                break;  

                case 2:
                perfectText = 'Good!';
                break;  

                case 3:
                perfectText = 'Almost!';
                break;  

                case 4:
                perfectText = '';
                break;  
            }

            this.floatText(perfectText, player.x, player.top);

            var emitter = this.game.add.emitter(player.x, player.bottom, 200);
            emitter.width = player.body.width - 40;
            var eVel = 200 - 20 * perfectBlock;
            var eLife = 1250 - 30 * perfectBlock;
            // emitter.makeParticles('GameAtlas', 'star');
            emitter.makeParticles('GameAtlas', 'white_square');

            emitter.minParticleSpeed.setTo(-eVel,-eVel * 5);
            emitter.maxParticleSpeed.setTo(eVel,-eVel * 2);
            
            emitter.maxParticleScale = 1;
            emitter.minParticleScale = .2;

            emitter.maxParticleAlpha = .9;
            emitter.minParticleAlpha = .2;

            emitter.gravity = 1000;

            emitter.start(true, eLife, null, 20 - 5 * perfectBlock);

            emitter.children.forEach((ptx) => {
                var tweenScale = ptx.game.add.tween(ptx.scale);
                var tweenAlpha = ptx.game.add.tween(ptx);

                tweenScale.to({ x: 0, y: 0 }, eLife/1.5)
                .delay(eLife / 3);
                tweenAlpha.to({ alpha: 1 }, eLife/3)
                .to({ alpha: 0 }, eLife/1.5);

                tweenScale.start();
                tweenAlpha.start();
            }, emitter);

        }
    },

    playerJumpCollide(player, block) {
        this.player.isPlayerJump = false;
        this.player.play('idle');
    },

    floatText(text, x, y) {
        var textStyle = {fill: '#fff', font: '35px Arial'};

        var floatingText = this.game.add.text(x, y, text, textStyle);
        floatingText.anchor.setTo(.5);

        var textFloatTween = this.game.add.tween(floatingText);
        textFloatTween.to({y: y - 80, alpha: 0}, 700, Phaser.Easing.Cubic.InOut);
        textFloatTween.killOnComplete = true;

        
        var textFloatTweenScale = this.game.add.tween(floatingText.scale);
        textFloatTweenScale.from({x: 0.5, y: 0.5}, 500, Phaser.Easing.Cubic.Out);

        textFloatTween.start();
        textFloatTweenScale.start();

    },

    createMovingBlock(isStatic) {
        if(!this.blocks.blocksAlive){
            var dir = isStatic ? 0 : ((Math.random() > .5) ? -1 : 1);
            var index = this.blocks.numBlocks;
            this.blocks.numBlocks++;
            var speed = this.DEFAULT_SPEED * (1 + Math.floor(index / this.REPEAT_BLOCKS) / this.SPEED_BOOSTER);
            var frame = 7 + (Math.floor(index / this.REPEAT_BLOCKS) % 5);
            var frameName = (frame + '').length < 2 ? 'block_0' + frame : 'block_' + frame;
            var x = this.game.world.centerX - (this.game.world.width + 300) / 2 * dir;
            var y = this.blocks.towerHeight - 2;

            // this.blocks.forEach(item => {
            //     if(item.y > (this.game.camera.view.bottom + 200)){
            //         item.kill();
            //     }
            // }, this);

            var block = this.blocks.getFirstExists(false);

            if(!block){
                block = new JumpStack.Block(this, 
                    x, 
                    y, 
                    {asset: 'GameAtlas', frame: frameName, dir: dir, speed: speed});

                this.blocks.add(block);
            }else{
                block.reset(x, y, {asset: 'GameAtlas', frame: frameName, dir: dir, speed: speed});
            }

            block.y -= block.body.height;

            if(isStatic){
                this.blocks.blocksAlive = null;
            }else{
                this.blocks.blocksAlive = block;
            }

            this.blocks.towerHeight = this.getTowerHeight(this.blocks);
        }
        return block;
    },

    update() {
        this.game.camera.focusOnXY(this.player.x, this.player.y - 50);
        this.game.camera.lerp = 0.2;

        // this.game.physics.arcade.collide( this.player, this.blocks, (player, block) => this.playerHit(player, block), (player, block) => this.playerHit(player, block), this );
        if(this.blocks.blocksAlive){
            this.game.physics.arcade.collide(this.player, this.blocks.blocksAlive, this.playerHit, null, this);
        }
        this.game.physics.arcade.collide(this.blocks, this.player, this.playerJumpCollide, null, this);

        // this.game.physics.arcade.overlap(this.player, this.blocks.blocksAlive, (block, player) => this.playerHit(block, player), null, this);


    }
};