var Match3 = Match3 || {};

Match3.GameState = {

  init: function() {
    this.NUM_ROWS = 8;
    this.NUM_COLS = 8;
    this.NUM_VARIATIONS = 6;
    this.BLOCK_SIZE = 35;
    this.ANIMATION_TIME = 250;
  },
  create: function() {
    //game background
    this.background = this.add.sprite(0, 0, 'background');

    //board model
    this.board = new Match3.Board(this, this.NUM_ROWS, this.NUM_COLS, this.NUM_VARIATIONS);
    this.board.consoleLog();

    this.blocks = this.add.group();

    // this.styleText = {font: 'bold Arial 20px', fill:'#000'};
    // this.textBoard = this.add.text(this.game.world.centerX, this.game.world.centerY, this.styleText, '');
    // this.textBoard.anchor.setTo(0.5);
    // this.textBoard.scale.setTo(1.2,.9);

    this.drawBoard();
    // this.board.clearChains();
    // this.board.updateGrid();


    // var block1 = this.blocks.children[10];
    // var block2 = this.blocks.children[11];
    // this.swapBlocks(block1, block2);

  },

  drawBoard(){
    var square, x, y, data;

    //semi-transparent black squares cells
    var squareBitmap = this.add.bitmapData(this.BLOCK_SIZE + 6, this.BLOCK_SIZE + 6);
    squareBitmap.circle(squareBitmap.width / 2, squareBitmap.height / 2, this.BLOCK_SIZE / 2 + 8, '#777');

    for(var i = 0; i < this.NUM_ROWS; i++)
    {
      for(var j = 0; j < this.NUM_COLS; j++)
      {
        x = this.game.world.centerX - (this.BLOCK_SIZE + 8) * this.NUM_COLS / 2 + (this.BLOCK_SIZE + 8) * (j + .5);
        y = 150 + i * (this.BLOCK_SIZE + 8);
        square = this.add.sprite(x, y, squareBitmap);
        square.anchor.setTo(.5);
        square.alpha = .2;
        this.createBlock(x, y, {asset: 'block' + this.board.grid[i][j], row: i, col: j});
      }
    }
    this.game.world.bringToTop(this.blocks);
  },

  createBlock(x, y, data){
    var block = this.blocks.getFirstExists(false);
    if(!block)
    {
      block = new Match3.Block(this, x, y, data);
      this.blocks.add(block);
    }else{
      block.reset(x, y, data);
    }
    return block;
  },

  getBlockFromColRow(position){
    var foundBlock;

    this.blocks.forEachAlive((block) => {
      if(block.row === position.row && block.col === position.col)
      {
        foundBlock = block;
      }
    }, this);

    return foundBlock;
  },

  dropReserveBlock(sourceRow, targetRow, col) {
    var del = col * 40;
    var x = this.game.world.centerX - (this.BLOCK_SIZE + 8) * this.NUM_COLS / 2 + (this.BLOCK_SIZE + 8) * (col + .5);
    var y = 150 - (this.BLOCK_SIZE + 8) * this.board.RESERVE_ROW + (this.BLOCK_SIZE + 8) * sourceRow;
    var data = {asset: 'block' + this.board.grid[targetRow][col], row: sourceRow, col: col};

    var block = this.createBlock(x, y, data);
    var targetY = 150 + targetRow * (this.BLOCK_SIZE + 8);

    block.row = targetRow;
    block.alpha = 0;

    var blockMovement = this.game.add.tween(block);
    var blockScale = this.game.add.tween(block.scale);
    blockMovement.to({ y: targetY, alpha: 1}, this.ANIMATION_TIME)
    .delay(this.ANIMATION_TIME * 3 + del);
    blockScale.to({ x: .9, y: 1.2}, this.ANIMATION_TIME/1.5)
    .to({ x: 1.2, y: .8}, this.ANIMATION_TIME/2)
    .to({ x: .95, y: 1.1}, this.ANIMATION_TIME/3)
    .to({ x: 1, y: 1}, this.ANIMATION_TIME/4)
    .delay(this.ANIMATION_TIME * 3 + del);
    blockMovement.start();
    blockScale.start();
  },

  dropBlock(sourceRow, targetRow, col) {
    var del = col * 40;
    var block = this.getBlockFromColRow({row: sourceRow, col: col});
    var targetY = 150 + targetRow * (this.BLOCK_SIZE + 8);
    block.row = targetRow;
    var blockMovement = this.game.add.tween(block);
    var blockScale = this.game.add.tween(block.scale);
    blockMovement.to({ y: targetY}, this.ANIMATION_TIME)
    .delay(this.ANIMATION_TIME * 3 + del);
    blockScale.to({ x: .9, y: 1.2}, this.ANIMATION_TIME/1.5)
    .to({ x: 1.2, y: .8}, this.ANIMATION_TIME/2)
    .to({ x: .95, y: 1.1}, this.ANIMATION_TIME/3)
    .to({ x: 1, y: 1}, this.ANIMATION_TIME/4)
    .delay(this.ANIMATION_TIME * 3 + del);
    blockMovement.start();
    blockScale.start();
  },

  swapBlocks(block1, block2){
    var blockScaleBack = this.game.add.tween(block1.scale);
    blockScaleBack.to({x: .8, y: .6}, 50)
    .to({x: 1.1, y: 1.2}, 50)
    .to({x: 1, y: 1}, 50);
    blockScaleBack.start();

    var block1Move = this.game.add.tween(block1);
    block1Move.to({x: block2.x, y: block2.y}, this.ANIMATION_TIME)
    .onComplete.add(() => {
      this.board.swap(block1, block2);
      if(!this.isReversingSwap)
      {
        var chains = this.board.findAllChains();
        if(chains.length > 0){
          this.updateBoard();
        }else{
          this.isReversingSwap = true;
          this.swapBlocks(block1, block2);
        }
      }else{
        this.isReversingSwap = false;
        this.clearSelection();
      }
    }, this);
    block1Move.start();

    var block2Move = this.game.add.tween(block2);
    block2Move.to({x: block1.x, y: block1.y}, this.ANIMATION_TIME);
    block2Move.start();
  },

  pickBlock(block){
    if(this.uiBlocked)
    {
      return;
    }

    if(!this.selectedBlock)
    {
      var blockScaleUp = this.game.add.tween(block.scale);
      blockScaleUp.to({x: 1.75, y: 1.75}, 100)
      .to({x: 1.5, y: 1.5}, 100);
      blockScaleUp.start();

      this.selectedBlock = block;
    }else{
      this.targetBlock = block;

      if( this.board.checkAdjacent(this.selectedBlock, this.targetBlock) )
      {
        //block the UI
        this.uiBlocked = true;

        //swap the blocks
        this.swapBlocks(this.selectedBlock, this.targetBlock);

      }else{
        this.clearSelection();
      }
    }
  },

  clearSelection(){
    this.uiBlocked = false;
    var blockScaleBack = this.game.add.tween(this.selectedBlock.scale);
    blockScaleBack.to({x: .8, y: .6}, 100)
    .to({x: 1.1, y: 1.2}, 100)
    .to({x: 1, y: 1}, 100);
    blockScaleBack.start();

    this.selectedBlock = null;
    this.targetBlock = null;
  },

  updateBoard(){
    this.board.clearChains();
    this.board.updateGrid();

    //after the drop ended
    this.game.time.events.add(this.ANIMATION_TIME * 4, () => {
      var chains = this.board.findAllChains();

      if(chains.length > 0){
        this.updateBoard();
      }else{
        this.clearSelection();
      }

    }, this);
  },

  update: function() {
    // this.textBoard.text = this.board.consoleLog();
  }

};
