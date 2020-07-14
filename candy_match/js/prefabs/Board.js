var Match3 = Match3 || {};

Match3.Board = function(state, rows, cols, blockVariations) {

  this.state = state;
  this.rows = rows;
  this.cols = cols;
  this.blockVariations = blockVariations;

  //main grid
  this.grid = [];

  var i,j;
  for(i = 0; i < rows; i++) {
    this.grid.push([]);

    for(j = 0; j < cols; j++) {
      this.grid[i].push(0);
    }
  }

  //reserve grid on the top, for when new blocks are needed
  this.reserveGrid = [];

  this.RESERVE_ROW = this.rows;

  for(i = 0; i < this.RESERVE_ROW; i++) {
    this.reserveGrid.push([]);

    for(j = 0; j < this.cols; j++) {
      this.reserveGrid[i].push(0);
    }
  }

  this.populateGrid();
  this.populateReserveGrid();
};

Match3.Board.prototype.populateGrid = function(){

  var i,j,variation;
  for(i = 0; i < this.rows; i++) {
    for(j = 0; j < this.cols; j++) {
      variation = Math.floor( Math.random() * this.blockVariations ) + 1;
      this.grid[i][j] = variation;
    }
  }
};

Match3.Board.prototype.populateReserveGrid = function(){

  var i,j,variation;
  for(i = 0; i < this.RESERVE_ROW; i++) {
    for(j = 0; j < this.cols; j++) {
      variation = Math.floor( Math.random() * this.blockVariations ) + 1;
      this.reserveGrid[i][j] = variation;
    }
  }
};

Match3.Board.prototype.consoleLog = function() {
  var prettyString = this.reserveGrid.map(item => item.join(' ')).join('\n') +
  '\n' + 
  this.grid.map(item => '--').join('') + 
  '\n' + 
  this.grid.map(item => item.join(' ')).join('\n');


  // var i,j,variation;
  // for(i = 0; i < this.rows; i++) {
  //   for(j = 0; j < this.cols; j++) {
  //     prettyString += this.grid[i][j];
  //   }
  //   prettyString += '\n';
  // }
  // prettyString += '\n';

  // for(j = 0; j < this.cols; j++) {
  //   prettyString += '-';
  // }
  // prettyString += '\n\n';

  // for(i = 0; i < this.RESERVE_ROW; i++) {
  //   for(j = 0; j < this.cols; j++) {
  //     prettyString += this.reserveGrid[i][j];
  //   }
  //   prettyString += '\n';
  // }

  // console.log(prettyString);
  return prettyString;

};


/* 
SWAPING BLOCKS 
*/

Match3.Board.prototype.swap = function(source, target) {
  var temp = this.grid[target.row][target.col];
  this.grid[target.row][target.col] = this.grid[source.row][source.col];
  this.grid[source.row][source.col] = temp;

};

/* 
check if two blocks are adjacent 
*/

Match3.Board.prototype.checkAdjacent = function(source, target) {
  var diffRow = Math.abs(source.row - target.row);
  var diffCol = Math.abs(source.col - target.col);

  var isAdjacent = (diffRow == 1 && !diffCol) || (!diffRow && diffCol == 1);

  return isAdjacent;
};

/* 
Is blocks chained
*/

 Match3.Board.prototype.isChained = function(block) {
    var isChained = false;
    var variation = this.grid[block.row][block.col];
    var row = block.row;
    var col = block.col;

    //left
    if(variation == this.grid[row][col - 1] && variation == this.grid[row][col - 2])
    {
      isChained = true;
    }

    //right
    if(variation == this.grid[row][col + 1] && variation == this.grid[row][col + 2])
    {
      isChained = true;
    }

    //up
    if(this.grid[row - 2])
    {
      if(variation == this.grid[row - 1][col] && variation == this.grid[row - 2][col])
      {
        isChained = true;
      }
    }

    //down
    if(this.grid[row + 2])
    {
      if(variation == this.grid[row + 1][col] && variation == this.grid[row + 2][col])
      {
        isChained = true;
      }
    }

    //center - horizontal
    if(variation == this.grid[row][col + 1] && variation == this.grid[row][col - 1])
    {
      isChained = true;
    }

    //center - vertical
    if(this.grid[row + 1] && this.grid[row - 1])
    {
      if(variation == this.grid[row + 1][col] && variation == this.grid[row - 1][col])
      {
        isChained = true;
      }
    }

    return isChained;

 };

/* 
Find all chained blocks
*/

 Match3.Board.prototype.findAllChains = function() {
   var chained = []; 
   for(var i = 0; i < this.rows; i++) {
     for(var j = 0; j < this.cols; j++) {
       if( this.isChained({row: i, col: j}) )
       {
        chained.push({row: i, col: j});
       }
     }
   }
   return chained;
 };

/* 
Clear all the chains 
Set chained blocks to zero
*/

 Match3.Board.prototype.clearChains = function() {
   //get all chined blocks
   var chainedBlocks = this.findAllChains();

   //set blocks to zero
   chainedBlocks.forEach(block => {
      this.grid[block.row][block.col] = 0;

      //kill the block object
      this.state.getBlockFromColRow(block).kill();
      
   }, this);
 };

 /* 
 Drop the block in the main grid from a postition to another. 
 the source is set to zero
 */

Match3.Board.prototype.dropBlock = function(sourceRow, targetRow, col) {
  this.grid[targetRow][col] = this.grid[sourceRow][col];
  this.grid[sourceRow][col] = 0;
}

/* 
Drop the block in the main grid from a postition to another. 
the source is set to zero
*/

Match3.Board.prototype.dropReserveBlock = function(sourceRow, targetRow, col) {
  this.grid[targetRow][col] = this.reserveGrid[sourceRow][col];
  this.reserveGrid[sourceRow][col] = 0;
};

/* 
Move down blocks to fill in the emty cells
*/

Match3.Board.prototype.updateGrid = function(){
  var foundBlock;

  //go through all the rows from bottom up
  for(var i = this.rows - 1; i >= 0; i--)
  {
    for(var j = 0; j < this.cols; j++)
    {
      //if block is zero get the first non-zero by climbing up
      if( this.grid[i][j] === 0 )
      {
        foundBlock = false;

        //now climb up an look up
        for(var k = i - 1; k >= 0; k--)
        {
          if(this.grid[k][j] > 0)
          {
            this.dropBlock(k, i, j);
            foundBlock = true;
            break;
          }
        }

        if(!foundBlock)
        {
          //climb higher to reserve grid
        for(var k = this.RESERVE_ROW - 1; k >= 0; k--)
        {
          if(this.reserveGrid[k][j] > 0)
          {
            this.dropReserveBlock(k, i, j);
            foundBlock = true;
            break;
          }
        }

        }
      }
    }
  }

  //repopulate the reserve grid

  this.populateReserveGrid();
}
