var JumpStack = JumpStack || {};

JumpStack.GameState = {
    create() {
        var worldCenter = {x: this.game.world.centerX, y: this.game.world.centerY};

        this.background = this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'GameAtlas', 'bg');
        this.ground = this.game.add.sprite(this.game.world.centerX, this.game.world.height, 'GameAtlas', 'platform_01');
        this.ground.anchor.setTo(.5,1);

        this.blocks = this.game.add.group();
        var block = new JumpStack.Block(this, this.game.world.centerX, this.game.world.height - 50, {asset: 'GameAtlas', frame: 'block_03'});
        this.blocks.add(block);

    }
};