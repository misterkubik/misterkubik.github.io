var Match3 = Match3 || {};

Match3.GameState = {

  init: function() {
    this.NUM_ROWS = 8;
    this.NUM_COLS = 8;
    this.NUM_VARIATIONS = 6;
    this.BLOCK_SIZE = 35;
    this.ANIMATION_TIME = 200;
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

  update: function() {
    // this.textBoard.text = this.board.consoleLog();
  }

};
