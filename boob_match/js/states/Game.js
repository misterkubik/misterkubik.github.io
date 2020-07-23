var Match3 = Match3 || {};

Match3.GameState = {

  init: function() {
    this.NUM_ROWS = 6;
    this.NUM_COLS = 6;
    this.SCREEN_OFFSET = .2;
    this.NUM_VARIATIONS = 4;
    this.HINT_TIME = 4;

    if( (this.game.world.width - this.game.world.height) < 0)
    {
      this.BLOCK_SIZE = (this.game.world.width - this.game.world.width * this.SCREEN_OFFSET) / this.NUM_ROWS;
    }else{
      this.BLOCK_SIZE = (this.game.world.height - this.game.world.height * this.SCREEN_OFFSET) / this.NUM_ROWS;
    }

    this.ANIMATION_TIME = 200;

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

    this.hintTimer = this.game.time.create(false);
    this.hintTimer.add(Phaser.Timer.SECOND * this.HINT_TIME, () => this.hintBlocks(), this);
    this.hintTimer.start();

  },

  drawBoard(){
    var square, x, y, data;

    for(var i = 0; i < this.NUM_ROWS; i++)
    {
      for(var j = 0; j < this.NUM_COLS; j++)
      {
        x = this.game.world.centerX - (this.BLOCK_SIZE + 8) * this.NUM_COLS / 2 + (j + .5) * (this.BLOCK_SIZE + 8);
        y = this.game.world.centerY - (this.BLOCK_SIZE + 8) * this.NUM_COLS / 2 + (i + .5) * (this.BLOCK_SIZE + 8);
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
    var y = this.game.world.centerY - (this.BLOCK_SIZE + 8) * this.NUM_COLS / 2 - (this.BLOCK_SIZE + 8) * this.board.RESERVE_ROW + (this.BLOCK_SIZE + 8) * (sourceRow + .5);
    var data = {asset: 'block' + this.board.grid[targetRow][col], row: sourceRow, col: col};

    var block = this.createBlock(x, y, data);
    var targetY = this.game.world.centerY - (this.BLOCK_SIZE + 8) * this.NUM_COLS / 2 + (targetRow + .5) * (this.BLOCK_SIZE + 8);

    block.row = targetRow;
    block.origin.y = targetY;
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
    var targetY = this.game.world.centerY - (this.BLOCK_SIZE + 8) * this.NUM_COLS / 2 + (targetRow + .5) * (this.BLOCK_SIZE + 8);
    block.row = targetRow;
    block.origin.y = targetY;
    var blockMovement = this.game.add.tween(block);
    var blockScale = this.game.add.tween(block.scale);
    var rescaleBlock = block.backedScale;
    blockMovement.to({ y: targetY}, this.ANIMATION_TIME)
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

  swapBlocks(block1, block2){
    var rescaleBlock = block1.backedScale;
    this.hintTimer.removeAll();

    var tmpOrigin = block1.origin;
    block1.origin = block2.origin;
    block2.origin = tmpOrigin;

    var blockScaleBack = this.game.add.tween(block1.scale);
    blockScaleBack.to({x: rescaleBlock * .75, y: rescaleBlock * .7}, 50)
    .to({x: rescaleBlock * 1.02, y: rescaleBlock * 1.07}, 50)
    .to({x: rescaleBlock, y: rescaleBlock}, 50);
    blockScaleBack.start();

    var block1Move = this.game.add.tween(block1);
    block1Move.to({x: block1.origin.x, y: block1.origin.y}, this.ANIMATION_TIME)
    .onComplete.add(() => {

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
        this.updateBoard();
      }
      
    }, this);
    block1Move.start();

    var block2Move = this.game.add.tween(block2);
    block2Move.to({x: block2.origin.x, y: block2.origin.y}, this.ANIMATION_TIME)
    .onComplete.add(() => {
    }, this);
    block2Move.start();
  },

  checkAdjacent(source, target) {
    var diffRow = Math.abs(source.row - target.row);
    var diffCol = Math.abs(source.col - target.col);

    var isAdjacent = (diffRow == 1 && !diffCol) || (!diffRow && diffCol == 1);

    return isAdjacent;
  },

  dragSwapBlock(block) {

    if( Math.abs(block.origin.x - this.game.input.position.x ) >  Math.abs(block.origin.y - this.game.input.position.y ) ){
      block.input.allowHorizontalDrag = true;
      block.input.allowVerticalDrag = false;
      var swapAxisTween = this.game.add.tween(block);
      swapAxisTween.to({y: block.origin.y}, 50);
      swapAxisTween.start();
      // block.y = block.origin.y;

      if( Math.abs(block.origin.x - this.game.input.position.x ) > (this.BLOCK_SIZE + 5) ){
        block.input.disableDrag();
        this.relBlock(block);

      }
    }else{
      block.input.allowHorizontalDrag = false;
      block.input.allowVerticalDrag = true;
      var swapAxisTween = this.game.add.tween(block);
      swapAxisTween.to({x: block.origin.x}, 50);
      swapAxisTween.start();
      // block.x = block.origin.x;

      if( Math.abs(block.origin.y - this.game.input.position.y ) > (this.BLOCK_SIZE + 5) ){
        block.input.disableDrag();
        this.relBlock(block);
      }
    }

  },

  pickBlock(block, event){

    if(this.uiBlocked)
    {
      return;
    }

    if(!this.selectedBlock)
    {
      block.input.draggable = true;
      block.origin = block.input.dragStartPoint.setTo(block.x, block.y);
      block.input.enableSnap(this.BLOCK_SIZE + 8, this.BLOCK_SIZE + 8, false, true, block.input.dragStartPoint.x, block.input.dragStartPoint.y);
      block.input.bringToTop = true;

      block.events.onDragStart.add(this.dragSwapBlock, this);
      block.events.onDragStop.add(this.relBlock, this);

      var blockScaleUp = this.game.add.tween(block.scale);

      block.downPosition = event.position;

      // block.events.onInputUp.add(this.slideBlock, this);

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

  getDirection(block){
    var thld = 5;
    var x = ( Math.abs(block.origin.x - block.x) > thld && Math.abs(block.origin.x - block.x) > Math.abs(block.origin.y - block.y) ) ? (block.origin.x - block.x) / Math.abs((block.origin.x - block.x)) : 0;
    var y = ( Math.abs(block.origin.y - block.y) > thld && Math.abs(block.origin.y - block.y) > Math.abs(block.origin.x - block.x) ) ? (block.origin.y - block.y) / Math.abs((block.origin.y - block.y)) : 0;

    return {x: x, y: y};
  },

  relBlock(block) {
    var swipeRate = this.getDirection(block);

    var nearestBlocks = this.blocks.children.filter((item) => {
      return this.checkAdjacent(item, block);
    }, this);

    var targetBlock = this.getBlockFromColRow({row: block.row - swipeRate.y, col: block.col - swipeRate.x});

    if(targetBlock){
      this.swapBlocks(block, targetBlock);
      this.uiBlocked = true;
      this.clearSelection();
    }else{
      nearestBlocks.forEach( item => {
        var backTween = this.game.add.tween(item);
        backTween.to({x: item.origin.x, y: item.origin.y}, 100);
        backTween.start();
      }, this);

      var backTweenBlock = this.game.add.tween(block);
      backTweenBlock.to({x: block.origin.x, y: block.origin.y}, 100);
      backTweenBlock.start();
      this.clearSelection();
    }
  },

  clearSelection(){
    this.uiBlocked = false;
    if(this.selectedBlock){
      var blockScaleBack = this.game.add.tween(this.selectedBlock.scale);
      var rescaleBlock = this.selectedBlock.backedScale;
      blockScaleBack.to({x: rescaleBlock * 1.04, y: rescaleBlock * 1.06}, 50)
      .to({x: rescaleBlock, y: rescaleBlock}, 50);
      blockScaleBack.start();
    }
    this.blocks.forEach( item => {
      var backTween = this.game.add.tween(item);
      backTween.to({x: item.origin.x, y: item.origin.y}, 75).start();
    }, this);

    this.selectedBlock = null;
    this.targetBlock = null;

    // this.hintTimer.add(Phaser.Timer.SECOND * this.HINT_TIME, () => this.hintBlocks(), this);
  },

  hintBlocks(){
    var hintsList = this.board.findAllHints();
    var randomHint = hintsList[Math.floor(Math.random() * hintsList.length)];
    this.getBlockFromColRow(randomHint).play(randomHint.chainedTo);

    // this.hintTimer.add(Phaser.Timer.SECOND * this.HINT_TIME, () => this.hintBlocks(), this);
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

  update(){
    if(this.selectedBlock){
      var block = this.selectedBlock;

      if(this.selectedBlock.input.isDragged){
        this.dragSwapBlock(this.selectedBlock);
        var nearestBlocks = this.blocks.children.filter((item) => {
          return this.checkAdjacent(item, block);
        }, this);

        nearestBlocks.forEach((item) => {
          var backTween = this.game.add.tween(item);
          var thld = 5;
          backTween.to({x: item.origin.x, y: item.origin.y}, 20);

          if( (Math.abs(item.origin.x - block.x) - Math.abs(item.origin.x - block.origin.x)) < -thld )
            {
              item.x -= block.deltaX;
            }else if( (Math.abs(item.origin.y - block.y) - Math.abs(item.origin.y - block.origin.y)) < -thld )
            {
              item.y -= block.deltaY;
            }else{
              backTween.start();
            }
        }, this);

      }
    }
    
  }

};
