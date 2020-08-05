var JumpStack = JumpStack || {};

JumpStack.GameState = {
    create() {
        this.DEFAULT_SPEED = 1000;
        this.SPEED_BOOSTER = 5;  // as low as fast 
        this.REPEAT_BLOCKS = 3;
        this.BOUNCE_BOOSTER = 1.05;
        this.BLOCKS_DELAY_MIN = 50;
        this.BLOCKS_DELAY_MAX = 1000;
        this.introPhase = true;
        var worldCenter = {x: this.game.world.centerX, y: this.game.world.centerY};
        this.background = this.game.add.tileSprite(0, 0, this.game.world.width, Phaser.DOM.layoutBounds.height, 'GameAtlas', 'bg');
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

        if(this.player.isPlayerJump){
        }else{
            this.player.body.velocity.y = -700;
            this.player.isPlayerJump = true;
        }
    },

    playerHit(player, block) {
        block.blockMove.stop();
        // console.log(block);

        if( (player.body.touching.left || player.body.touching.right) ) {
            console.log('side');
            this.blocks.blocksAlive = null;
            this.player.isPlayerAlive = null;
            block.blockMove.stop();
            
            // player.body.enabled = false;
            // player.body.allowGravity = false;
            this.player.body.immovable = true;
            player.isPlayerJump = true;
        }else if( player.body.touching.down && this.player.isPlayerAlive ){
            player.isPlayerJump = false;
            if(block === this.blocks.blocksAlive){
                this.blocks.towerHeight = block.y;
                this.blocks.blocksAlive = null;
                if(this.player.isPlayerAlive){
                    var newBlockDealy = Math.max(this.BLOCKS_DELAY_MIN,Math.random() * this.BLOCKS_DELAY_MAX);
                    this.game.time.events.add(newBlockDealy, this.createMovingBlock, this);
                }
            } 
        }
    },

    playerJumpCollide(player, block) {
        player.isPlayerJump = false;
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

            this.blocks.forEach(item => {
                if(item.y > (this.game.camera.view.bottom + 200)){
                    item.kill();
                }
            }, this);

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

        this.game.physics.arcade.collide(this.blocks, this.player, this.playerJumpCollide);

        this.game.physics.arcade.collide(this.player, this.blocks.blocksAlive, (block, player) => this.playerHit(block, player), null, this);

    }
};