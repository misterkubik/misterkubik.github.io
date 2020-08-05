var JumpStack = JumpStack || {};

JumpStack.GameState = {
    create() {
        this.DEFAULT_SPEED = 200;
        this.SPEED_BOOSTER = 5;  // as low as fast 
        this.REPEAT_BLOCKS = 3;
        this.BOUNCE_BOOSTER = 1.05;
        this.BLOCKS_DELAY = 50;
        this.introPhase = true;
        var worldCenter = {x: this.game.world.centerX, y: this.game.world.centerY};
        this.background = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'GameAtlas', 'bg');
        this.background.tileScale.setTo(this.game.world.height / this.background._frame.height);

        this.ground = this.game.add.sprite(this.game.world.centerX, this.game.world.height, 'GameAtlas', 'platform_01');
        this.ground.anchor.setTo(.5,1);

        this.blocks = this.game.add.group();

        var block = new JumpStack.Block(this, this.game.world.centerX, this.game.world.height - 80, {asset: 'GameAtlas', frame: 'block_07'});

        block.body.allowGravity = false;
        block.body.immovable = true;
        this.blocks.add(block);
        this.blocks.blocksAlive = false;

        this.blocks.towerHeight = this.getTowerHeight(this.blocks);

        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.height - Phaser.DOM.layoutBounds.height - 100, 'GameAtlas', 'hero_jump_10'
        );
        this.player.anchor.setTo(.5);
        this.game.physics.arcade.enable(this.player);
        this.player.body.gravity.y = 500;
        this.player.body.setSize(80, 90, 30, 24);
        // console.log(this.player._frame.height)
        this.player.body.collideWorldBounds = true;
        this.player.isJumping = false;
        this.player.isPlayerAlive = true;

        this.game.input.onDown.add(this.heroJump, this);

    },

    getTowerHeight(group) {
        let height = group.children[group.children.length-1].y;

        return height;
    },

    heroJump() {

        if(this.introPhase){
            this.introPhase = false;
            this.game.time.events.add(200, this.createMovingBlock, this);

            return;
        }

        if(!this.player.isPlayerAlive){
            this.state.start('Game');
        }
        if(!this.player.isJumping){
            this.player.body.velocity.y = -700;
            this.player.isJumping = true;
        }
    },

    playerHit(player, block) {
        if( player.body.touching.left || player.body.touching.right ) {
            // player.kill();
            this.player.isPlayerAlive = false;
            
            block.body.allowGravity = false;
            block.body.velocity.x = 0;
            block.body.velocity.y = 0;
            block.body.immovable = true;

            player.body.allowGravity = false;
            player.body.velocity.x = 0;
            player.body.velocity.y = 0;
            player.body.immovable = true;
        }else if( player.body.touching.down ){

            this.game.camera.shake = (100, 500);

            block.body.allowGravity = false;
            block.body.velocity.x = 0;
            block.body.velocity.y = 0;
            block.body.immovable = true;
            
            if(block === this.blocks.blocksAlive ){
                this.blocks.blocksAlive = false;
                this.game.time.events.add(this.BLOCKS_DELAY, this.createMovingBlock, this);
            }
        }

        player.isJumping = false;

    },

    createMovingBlock(isStatic) {
        if(!this.blocks.blocksAlive){
            var dir = isStatic ? 0 : ((Math.random() > .5) ? -1 : 1);
            var index = this.blocks.children.length;
            var speed = this.DEFAULT_SPEED * (1 + Math.floor(index / this.REPEAT_BLOCKS) / this.SPEED_BOOSTER);
            var frame = 7 + (Math.floor(index / this.REPEAT_BLOCKS) % 5);
            var frameName = (frame + '').length < 2 ? 'block_0' + frame : 'block_' + frame;
            var block = new JumpStack.Block(this, 
                this.game.world.centerX - (this.game.world.width + 300) / 2 * dir, 
                this.blocks.towerHeight - 3, 
                {asset: 'GameAtlas', frame: frameName, dir: dir, speed: speed}
            );

            block.y -= block.body.height;
            block.body.allowGravity = false;

            if(isStatic){
                block.body.immovable = true;
                this.blocks.blocksAlive = false;
            }else{
                this.blocks.blocksAlive = block;
            }

            // var cameraMove = this.game.add.tween(this.game.camera);
            // cameraMove.to({y: (block.y + 100)}, 300);
            // cameraMove.start();

            // this.game.camera.view.y = block.y;

            
            this.blocks.add(block);
            this.blocks.towerHeight = this.getTowerHeight(this.blocks);
        }

    },

    update() {
        this.game.camera.focusOnXY(this.player.x, this.player.y - 50);
        this.game.camera.lerp = 0.5;
        this.game.physics.arcade.collide(this.blocks, this.player, (block, player) => this.playerHit(block, player) );
        this.game.physics.arcade.collide(this.blocks);

    }
};