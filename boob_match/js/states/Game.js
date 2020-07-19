var Match3 = Match3 || {};

Match3.GameState = {

  init: function() {
    this.NUM_ROWS = 6;
    this.NUM_COLS = 6;
    this.NUM_VARIATIONS = 4;
    this.BLOCK_SIZE = 45;
    this.ANIMATION_TIME = 250;
  },
  create: function() {
    //game background
    this.background = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'background');
    this.background.anchor.setTo(.5);
    var bgSize = (this.game.world.width/this.game.world.height) > (this.background.width / this.background.height) ? this.game.world.width / this.background.width : this.game.world.height / this.background.height;
    this.background.scale.setTo(bgSize);


    //board model
    this.board = new Match3.Board(this, this.NUM_ROWS, this.NUM_COLS, this.NUM_VARIATIONS);
    this.board.consoleLog();

    this.blocks = this.add.group();

    this.drawBoard();
  },

  drawBoard(){
    var square, x, y, data;

    for(var i = 0; i < this.NUM_ROWS; i++)
    {
      for(var j = 0; j < this.NUM_COLS; j++)
      {
        x = this.game.world.centerX - (this.BLOCK_SIZE + 8) * this.NUM_COLS / 2 + (this.BLOCK_SIZE + 8) * (j + .5);
        y = 150 + i * (this.BLOCK_SIZE + 8);
        square = this.add.sprite(x, y, 'cell');
        square.anchor.setTo(.5);
        square.scale.setTo( (this.BLOCK_SIZE + 8 ) / square.width);
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
    var rescaleBlock = block.backedScale;
    blockMovement.to({ y: targetY, alpha: 1}, this.ANIMATION_TIME)
    .delay(this.ANIMATION_TIME * 3 + del)
    .onComplete.add(() => {
      block.play('bottom');
    }, this);

    blockScale.to({ x: rescaleBlock * .9, y: rescaleBlock * 1.2}, this.ANIMATION_TIME/1.5)
    .to({ x: rescaleBlock * 1.2, y: rescaleBlock * .8}, this.ANIMATION_TIME/2)
    .to({ x: rescaleBlock * .95, y: rescaleBlock * 1.1}, this.ANIMATION_TIME/3)
    .to({ x: rescaleBlock, y: rescaleBlock}, this.ANIMATION_TIME/4)
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
    var rescaleBlock = block.backedScale;
    blockMovement.to({ y: targetY}, this.ANIMATION_TIME)
    .delay(this.ANIMATION_TIME * 3 + del)
    .onComplete.add(() => {
      block.play('bottom');
    }, this);;

    blockScale.to({ x: rescaleBlock * .9, y: rescaleBlock * 1.2}, this.ANIMATION_TIME/1.5)
    .to({ x: rescaleBlock * 1.2, y: rescaleBlock * .8}, this.ANIMATION_TIME/2)
    .to({ x: rescaleBlock * .95, y: rescaleBlock * 1.1}, this.ANIMATION_TIME/3)
    .to({ x: rescaleBlock, y: rescaleBlock}, this.ANIMATION_TIME/4)
    .delay(this.ANIMATION_TIME * 3 + del);
    blockMovement.start();
    blockScale.start();
  },

  swapBlocks(block1, block2){
    var blockScaleBack = this.game.add.tween(block1.scale);
    var rescaleBlock = block1.backedScale;
    blockScaleBack.to({x: rescaleBlock * .8, y: rescaleBlock * .6}, 50)
    .to({x: rescaleBlock * 1.1, y: rescaleBlock * 1.2}, 50)
    .to({x: rescaleBlock, y: rescaleBlock}, 50);
    blockScaleBack.start();

    var block1Move = this.game.add.tween(block1);
    block1Move.to({x: block2.x, y: block2.y}, this.ANIMATION_TIME)
    .onComplete.add(() => {
      this.board.swap(block1, block2);
      if(block1.x == block2.x){
        if(block1.y - block2.y > 0 ){
          block1.play('top');
          block2.play('bottom');
        }else{
          block1.play('bottom');
          block2.play('top');
        }
      }else if(block1.y == block2.y){
        if(block1.x - block2.x > 0 ){
          block1.play('left');
          block2.play('right');
        }else{
          block1.play('right');
          block2.play('left');
        }
      }
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
      var rescaleBlock = block.backedScale;
      blockScaleUp.to({x: rescaleBlock * 1.65, y: rescaleBlock * 1.5}, 100)
      .to({x: rescaleBlock * 1.3, y: rescaleBlock * 1.3}, 100);
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
    var rescaleBlock = this.selectedBlock.backedScale;
    blockScaleBack.to({x: rescaleBlock * .8, y: rescaleBlock * .6}, 100)
    .to({x: rescaleBlock * 1.1, y: rescaleBlock * 1.2}, 100)
    .to({x: rescaleBlock, y: rescaleBlock}, 100);
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
