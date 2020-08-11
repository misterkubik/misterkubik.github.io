var JumpStack = JumpStack || {};

JumpStack.GameState = {
    create() {
        this.DEFAULT_SPEED = 1000;
        this.REPEAT_BLOCKS = 3;
        this.BOUNCE_BOOSTER = 1.05;
        this.BLOCKS_DELAY_MIN = 0;
        this.BLOCKS_DELAY_MAX = 1500;
        this.START_BLOCKS = 0;
        this.introPhase = true;
        this.gameOver = false;
        var worldCenter = {x: this.game.world.centerX, y: this.game.world.centerY};
        var cameraCenter = {x: this.game.camera.centerX, y: this.game.camera.centerY};
       
        this.background = this.game.add.group();
        this.background.fixedToCamera = true;

        this.bg1 = this.background.create(this.game.camera.view.centerX, this.game.camera.view.height + 0, 'Background', 'bg1');
        this.bg2 = this.background.create(this.game.camera.view.centerX, this.game.camera.view.height + 0, 'Background', 'bg2');
        this.bg3 = this.background.create(this.game.camera.view.centerX, this.game.camera.view.height + 0, 'Background', 'bg3');
        this.bg4 = this.background.create(this.game.camera.view.centerX, this.game.camera.view.height, 'Background', 'bg4');
        this.bg5 = this.background.create(this.game.camera.view.centerX, this.game.camera.view.height, 'Background', 'bg5');

        this.background.setAll('anchor.x', .5);
        this.background.setAll('anchor.y', 1);

        this.ground = this.game.add.sprite(this.game.world.centerX - 4, this.game.world.height + 18, 'Background', 'ground');
        this.ground.anchor.setTo(.5,1);

        this.blocks = this.game.add.group();
        this.blocks.numBlocks = 0;
        this.blocks.enableBody = true;

        var block = this.createMovingBlock(true);
        block.y = this.game.world.height - 80;
        this.blocks.towerHeight = this.getTowerHeight(this.blocks);


        for(var i = 0; i < this.START_BLOCKS - 1; i++){
            var block = this.createMovingBlock(true);
        }

        this.blocks.blocksAlive = null;


        var playerSpawn = {x: worldCenter.x, y: this.blocks.top - Phaser.DOM.documentBounds.height / 1.5 };

        this.player = new JumpStack.Player(this, playerSpawn.x, playerSpawn.y, {asset: 'Frog', frame: 'frog_idle_01'});

        this.game.add.existing(this.player);

        this.game.input.onDown.add(this.heroJump, this);
        this.game.input.priorityID = 0;

        this.game.input.minPriorityID = 1;

        this.overlay = this.game.add.tileSprite(-200, -200, this.game.world.width, this.game.world.height, 'Background', 'bg_tile');
        this.overlay.tileScale.setTo(this.overlay.height / this.overlay._frame.height);
        this.overlay.fixedToCamera = true;
        this.overlay.alpha = .8;

        var textStyle = {fill: '#fff', font: '50px libre_franklinblack'};

        this.score = 0;

        this.scoreText = this.game.add.text(cameraCenter.x, cameraCenter.y, '', textStyle);

        this.scoreText.anchor.setTo(.5);
        this.scoreText.alpha = 0;
        this.scoreText.fixedToCamera = true;
        this.scoreText.cameraOffset.y = 50;
        this.scoreText.strokeThickness = 6;

        this.introText = this.game.add.text(cameraCenter.x, 0, 'TAP to JUMP', textStyle);

        this.introText.alpha = 0; // Hide "Tap to Jump" title

        this.introText.anchor.setTo(.5);
        this.introText.fontSize = '40px';
        this.introText.fixedToCamera = true;
        this.introText.cameraOffset.y = Phaser.DOM.documentBounds.height - 50;

        this.cameraFollow = this.player;
        // this.game.camera.setBoundsToWorld();

        this.wrapper = this.game.add.group();

        this.wrapper.addMultiple([this.ground, this.blocks, this.player]);

        this.hint = this.game.add.sprite(this.game.camera.view.centerX, this.game.camera.view.y + 30, 'Hint', 'hint_00');
        this.hint.anchor.setTo(.5, 0);
        this.hint.fixedToCamera = true;
        this.hint.animations.add('hint', null, 15, true);
        this.hint.play('hint');

        this.retryButton = this.game.add.sprite(this.game.camera.view.centerX, this.game.camera.view.centerY, 'Background', 'retry');
        this.retryButton.alpha = 0;
        this.retryButton.anchor.setTo(.5);
        this.retryButton.fixedToCamera = true;

        this.autoplayButton = this.game.add.button(this.game.camera.view.width - 35, 35, 'Background', this.autoplayToggle, this);
        this.autoplayButton.frameName = 'play';
        this.autoplayButton.anchor.setTo(.5);
        this.autoplayButton.scale.setTo(.3);
        this.autoplayButton.alpha = .5;
        this.autoplayButton.fixedToCamera = true;

        this.autoplayButton.input.priorityID = 2;

        // this.overlay.bringToTop();
        this.introText.bringToTop();
        this.hint.bringToTop();
        this.autoplayButton.bringToTop();

        this.player.bringToTop();

        // this.autoplayButton.inputEnabled = true;
        // this.autoplayButton.input.add(this, this.autoplay);
    },

    getTowerHeight(group) {
        let height = group.children[group.children.length-1].y;

        return height;
    },

    heroJump() {

        if(this.uiBlocked){
            return;
        }

        if(this.introPhase){
            this.introPhase = false;
            var fadeOutText = this.game.add.tween(this.introText);
            fadeOutText.to({alpha: 0, y: this.introText.y + 50}, 500)
            .onComplete.add(() => {
                if(!this.autoplayed){
                    this.createMovingBlock();
                }
            }, this);
            fadeOutText.killOnComplete = true;
            // this.createMovingBlock();
            fadeOutText.start();

            var fadeInScore = this.game.add.tween(this.scoreText);
            fadeInScore.to({alpha: 1}, 500);
            fadeInScore.start();

            var fadeOutOverlay = this.game.add.tween(this.overlay);
            fadeOutOverlay.to({alpha: 0}, 200);
            fadeOutOverlay.start();

            var fadeOutHint = this.game.add.tween(this.hint);
            fadeOutHint.to({alpha: 0}, 200);
            fadeOutHint.start();

            this.scoreText.text = this.score;

            var fadeInScoreY = this.game.add.tween(this.scoreText.cameraOffset);
            fadeInScoreY.from({y: this.scoreText.cameraOffset.y - 100}, 500, Phaser.Easing.Cubic.Out);
            fadeInScoreY.start();

            var fadeOutAutoplay = this.game.add.tween(this.autoplayButton);
            fadeOutAutoplay.to({alpha: 0}, 500, Phaser.Easing.Cubic.Out);
            this.game.time.events.add(200, () =>  {
                if(!this.autoplayed){
                        this.autoplayButton.inputEnabled = false;
                        fadeOutAutoplay.start();
                }
            }, this);

            this.player.play('ready');
        }

        if(!this.player.isPlayerAlive){
            if(this.gameOver){
                this.game.camera.reset();
                this.game.camera.scale.setTo(1);
                this.state.start('Game');
            }
            return;
        }
        this.player.jump();

    },

    playerHit(player, block) {
        block.blockMove.stop();

        if( player.body.bottom > block.body.top ) {
            this.blocks.blocksAlive = null;
            player.isPlayerAlive = null;
            player.body.velocity.y = -800;
            player.body.velocity.x = 20 * block.direction;
            this.blocks.forEach(item => {
                item.body.enable = false;
            }, this);

            this.game.camera.shake(.02,200, true, Phaser.Camera.SHAKE_HORIZONTAL );
            this.game.camera.flash(0xffffff, 200);

            player.play('lose');

            var globalDelay = Math.min((this.START_BLOCKS + this.score) * 100, 3000);

            this.cameraZoomOut();

            var fadeOutTween = this.game.add.tween(this.overlay);
            fadeOutTween.to({alpha: 1}, 1000, Phaser.Easing.Cubic.Out)
            .delay(globalDelay)
            .onComplete.add(() => {
                this.gameOver = true;
            }, this);

            var showRetryTween = this.game.add.tween(this.introText);
            showRetryTween.to({alpha: 1}, 1000, Phaser.Easing.Cubic.Out)
            .delay(globalDelay);

            var showRetryBttnTween = this.game.add.tween(this.retryButton);
            showRetryBttnTween.to({alpha: 1}, 1000, Phaser.Easing.Cubic.Out)
            .delay(globalDelay);

            var showRetryTweenY = this.game.add.tween(this.introText.y);
            showRetryTweenY.to({y: this.introText.y - 500}, 1000, Phaser.Easing.Cubic.Out)
            .delay(globalDelay);

            // var hideScoreTween = this.game.add.tween(this.scoreText);
            // hideScoreTween.to({y: -200, alpha: 0}, 1000, Phaser.Easing.Cubic.Out)
            // .delay(500);

            // var hideScoreTweenY = this.game.add.tween(this.scoreText.cameraOffset);
            // hideScoreTweenY.to({y: this.scoreText.cameraOffset.y - 100}, 1000, Phaser.Easing.Cubic.Out)
            // .delay(500);

            this.overlay.bringToTop();
            this.scoreText.bringToTop();
            this.introText.bringToTop();
            this.retryButton.bringToTop();

            this.introText.text = 'RETRY';

            fadeOutTween.start();   //Fading in the overlay
            showRetryTween.start(); 
            // hideScoreTween.start(); 
            // hideScoreTweenY.start(); 
            showRetryBttnTween.start(); 
            showRetryTweenY.start(); 

            player.isPlayerJump = true;

            var emitter = this.game.add.emitter(player.x, player.y, 50);
            emitter.width = player.body.width - 40;
            var eVel = 50;
            var eLife = 750;
            emitter.makeParticles('Background', 'star');

            emitter.minParticleSpeed.setTo(eVel * 8 * block.direction, -eVel * 14);
            emitter.maxParticleSpeed.setTo(eVel * 5 *block.direction, -eVel * 7);
            
            emitter.maxParticleScale = .7;
            emitter.minParticleScale = .2;

            emitter.maxParticleAlpha = .9;
            emitter.minParticleAlpha = 0;

            emitter.gravity = 600;

            emitter.start(true, eLife, null, 8);

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

            this.floatText('Oh no...', player.x, player.bottom, 4);
        }else{
            player.isPlayerJump = false;
            player.play('land');
            this.blocks.towerHeight = block.y;
            this.blocks.blocksAlive = null;
            if(this.player.isPlayerAlive){
                var newBlockDealy = Math.max(this.BLOCKS_DELAY_MIN, Math.random() * this.BLOCKS_DELAY_MAX);

                this.game.time.events.add(newBlockDealy, this.createMovingBlock, this);
                if(this.autoplayed){
                    var randomJumpTime = newBlockDealy + 450 + Math.random() * 300;
                    this.game.time.events.add(randomJumpTime, () => this.player.jump(), this);
                }
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

            var textTemplates = {
                perfect: ['Perfect!', 'Excelent!', 'Super!', 'Wow!', 'Great!'],
                nice: ['Nice!', 'Cool!', 'Great!', 'Hot!', ''],
                good: ['Good', 'Not bad', 'Smoooth', ''],
                close: ['Almost', 'Too colse', 'Sharp'],
                bad: ['Bad', 'Meh', 'So so']
            }

            switch (perfectBlock) {
                case 0:
                perfectText = textTemplates.perfect[ Math.floor(Math.random() * textTemplates.perfect.length )];
                break;  

                case 1:
                perfectText = textTemplates.nice[ Math.floor(Math.random() * textTemplates.nice.length )];
                break;  

                case 2:
                perfectText = textTemplates.good[ Math.floor(Math.random() * textTemplates.good.length )];
                break;  

                case 3:
                perfectText = textTemplates.close[ Math.floor(Math.random() * textTemplates.close.length )];
                break;  

                case 4:
                perfectText = textTemplates.bad[ Math.floor(Math.random() * textTemplates.bad.length )];
                break;  
            }

            this.floatText(perfectText, player.x, (perfectBlock < 4 ? player.top + 50 : player.bottom), perfectBlock);

            var emitter = this.game.add.emitter(player.x, player.y + 15, 200);
            emitter.width = player.body.width - 40;
            var eVel = 200 - 20 * perfectBlock;
            var eLife = 1250 - 30 * perfectBlock;
            // emitter.makeParticles('GameAtlas', 'star');
            emitter.makeParticles('Background', 'particle');

            emitter.minParticleSpeed.setTo(-eVel,-eVel * 5);
            emitter.maxParticleSpeed.setTo(eVel,-eVel * 2);
            
            emitter.maxParticleScale = .5;
            emitter.minParticleScale = .01;

            emitter.maxParticleAlpha = .9;
            emitter.minParticleAlpha = .2;

            emitter.gravity = 1000;

            emitter.start(true, eLife, null, 40 - 10 * perfectBlock);
            this.player.bringToTop();

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
        if(player.isPlayerJump){
            this.player.play('land');
            player.isPlayerJump = false;
        }
    },

    floatText(text, x, y, vel) {
        var textStyle = {fill: '#fff', font: '35px libre_franklinblack'};

        var dir = vel < 4 ? 1 : -1;

        var floatingText = this.game.add.text(x, y, text, textStyle);
        floatingText.anchor.setTo(.5);

        var textFloatTween = this.game.add.tween(floatingText);
        textFloatTween.to({y: y - 80 * dir, alpha: 0}, 700, Phaser.Easing.Cubic.InOut);
        textFloatTween.killOnComplete = true;

        
        var textFloatTweenScale = this.game.add.tween(floatingText.scale);
        textFloatTweenScale.from({x: 0.5, y: 0.5}, 500, Phaser.Easing.Cubic.Out);

        textFloatTween.start();
        textFloatTweenScale.start();

    },

    cameraZoomOut() {
        this.cameraFollow = null;

        var camera = this.game.camera;

        var cameraZoom = Phaser.Math.clamp( (this.game.camera.view.height / (this.blocks.height + 200) ), 0.2, 1);
        var cameraScale = 1 - cameraZoom;
        var cameraHeight = this.blocks.height + 150;
        var cameraWidth = camera.view.width + Math.abs( camera.view.height - cameraHeight );
        var cameraX = camera.view.x - (camera.view.centerX - camera.view.centerX * cameraZoom);
        var cameraY = camera.view.bottom - (camera.view.centerY - camera.view.centerY * cameraZoom);


        var cameraZoomOut = this.game.add.tween(this.game.camera.scale);
        cameraZoomOut.to({ 
            x: cameraZoom, 
            y: cameraZoom 
        }, 2000, Phaser.Easing.Cubic.Out)
        .delay(700);

        var cameraMoveX = this.game.add.tween(this.game.camera);
        cameraMoveX.to({ 
            x: cameraX,
        }, 2000, Phaser.Easing.Cubic.Out)
        .delay(700);

        var cameraMoveY = this.game.add.tween(this.game.camera);
        cameraMoveY.to({ 
            y: cameraY,
        }, 1700, Phaser.Easing.Cubic.Out)
        .delay(700);


        cameraZoomOut.start();
        cameraMoveY.start();
        cameraMoveX.start();
    },

    getRandomFrame(arr){
        // console.log(arr);
        var frame = arr[Math.floor( Math.random() * arr.length)];

        if(frame === this.currentFruitFrame){
            frame = this.getRandomFrame(arr);
        }
        return frame;
    },

    createMovingBlock(isStatic) {
        if(!this.blocks.blocksAlive){
            var dir = isStatic ? 0 : ((Math.random() > .5) ? -1 : 1);
            var index = this.blocks.numBlocks;
            this.blocks.numBlocks++;
            var speed = this.DEFAULT_SPEED * (1 + Math.floor(index / this.REPEAT_BLOCKS) / this.SPEED_BOOSTER);

            this.fruitList = this.game.cache.getFrameData('Background')._frames.map(item => {
                return item.name;
            }, this);

            this.fruitList = this.fruitList.filter(item => {
                return /^fruit-/.test(item);
            });

            var frameName = this.getRandomFrame(this.fruitList);
            
            this.currentFruitFrame = frameName;
            var x = this.game.world.centerX - (this.game.camera.view.width + 200) / 2 * dir;
            var y = this.blocks.towerHeight - 2;

            var block = this.blocks.getFirstExists(false);

            if(!block){
                block = new JumpStack.Block(this, 
                    x, 
                    y, 
                    {asset: 'Background', frame: frameName, dir: dir, speed: speed});

                this.blocks.add(block);
            }else{
                block.reset(x, y, {asset: 'Background', frame: frameName, dir: dir, speed: speed});
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

    updateGameOnRendererResize(newWidth, newHeight) {

        this.game.width = newWidth;
        this.game.height = newHeight;
        this.game.stage.width = newWidth;
        this.game.stage.height = newHeight;
        this.game.camera.setSize(newWidth, newHeight);
        // this.game.input.scale.setTo(rendererScale);
        this.background.width = newWidth;
    
    },

    bgParalax() {
        this.background.children.forEach((layer, index) => {
            var index = index || 1;
            var camera = this.game.camera.view;
            var scale = this.game.camera.scale.y || 1;
            var zoom = 1 - scale;
            var world = this.game.world;
            layer.y = camera.height + (world.bottom - camera.bottom + 200) / 10 * index;
            
        }, this);
    },

    autoplayToggle() {
        if(!this.autoplayed){
            this.autoplayed = true;
            this.uiBlocked = true;
            console.log('Autoplay On');
            this.autoplay();
        }else{
            this.autoplayed = false;
            this.uiBlocked = false;
            console.log('Autoplay Off');

            var fadeOutAutoplay = this.game.add.tween(this.autoplayButton);
            fadeOutAutoplay.to({alpha: 0}, 500, Phaser.Easing.Cubic.Out);
            this.game.time.events.add(200, () =>  {
                if(!this.autoplayed){
                        this.autoplayButton.inputEnabled = false;
                        fadeOutAutoplay.start();
                }
            }, this);
        }
    },

    autoplay() {
        if(!this.autoplayed){
            this.autoplayed = true;
            this.uiBlocked = true;
            console.log('Autoplay On');
        }else{
            var newBlockDealy = Math.max(this.BLOCKS_DELAY_MIN, Math.random() * this.BLOCKS_DELAY_MAX);
            this.game.time.events.add(newBlockDealy, this.createMovingBlock, this);
            this.game.time.events.add(newBlockDealy + 750, () => this.player.jump(), this);
        }

        return this;
    },

    update() {
        if(this.cameraFollow){
            this.game.camera.focusOnXY(this.game.world.centerX, this.cameraFollow.y - 50);
            this.game.camera.lerp = 0.2;
        }

        this.background.cameraOffset.y = 0;

        this.background.scale.setTo(1 / this.game.camera.scale.y);
        this.introText.scale.setTo(1 / this.game.camera.scale.y);
        this.scoreText.scale.setTo(1 / this.game.camera.scale.y);
        this.retryButton.scale.setTo(1 / this.game.camera.scale.y);

        this.bgParalax();

        
        if(this.blocks.blocksAlive){
            this.game.physics.arcade.collide(this.player, this.blocks.blocksAlive, this.playerHit, null, this);
        }
        this.game.physics.arcade.collide(this.blocks, this.player, this.playerJumpCollide, null, this);



    }
};