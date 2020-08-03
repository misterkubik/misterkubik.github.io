var JumpStack = JumpStack || {};

JumpStack.game = new Phaser.Game('100%', '100%', Phaser.AUTO);

JumpStack.game.state.add('Boot', JumpStack.BootState);
JumpStack.game.state.add('Preload', JumpStack.PreloadState);
JumpStack.game.state.add('Game', JumpStack.GameState);

JumpStack.game.state.start('Boot');

