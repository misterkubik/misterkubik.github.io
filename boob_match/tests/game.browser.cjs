const assert=require('assert');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const page=await browser.newPage({viewport:{width:900,height:800}}), errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto((process.env.GAME_URL || 'http://127.0.0.1:8770/'));await page.waitForFunction(()=>window.Match3&&Match3.game.state.current==='Game'&&Match3.game.state.getCurrentState().blocks);
assert.equal(await page.getByRole('button').textContent(),'SHUFFLE');assert.equal(await page.evaluate(()=>Match3.game.state.getCurrentState().counterText.textContent),'0');
const setup=await page.evaluate(()=>{const s=Match3.game.state.getCurrentState();return {p:s.PITCH,size:s.BLOCK_SIZE,pos:s.getBlockPositionRowCol({row:2,col:2})};});
const {p,size,pos}=setup;
await page.mouse.move(pos.x+size/2+4,pos.y);await page.mouse.down();assert.equal(await page.evaluate(()=>!!Match3.game.state.getCurrentState().gesture),false);await page.mouse.up();
await page.mouse.move(pos.x,pos.y);await page.mouse.down();await page.mouse.move(pos.x+p*2.5,pos.y);
let drag=await page.evaluate(()=>{const s=Match3.game.state.getCurrentState(),g=s.gesture;return {dx:g.block.x-g.block.origin.x,ndx:g.neighbor.x-g.neighbor.origin.x,frame:g.block.poseFrame,nframe:g.neighbor.poseFrame,top:s.blocks.children.at(-1)===g.block,neighbor:[g.neighbor.row,g.neighbor.col]};});
assert(drag.dx>=p&&drag.dx<=p*1.25+0.01);assert(Math.abs(drag.ndx+p)<0.01);assert(drag.top);assert.notEqual(drag.frame,84);assert.notEqual(drag.nframe,84);
await page.mouse.move(pos.x,pos.y+p*2);assert.deepEqual(await page.evaluate(()=>{const g=Match3.game.state.getCurrentState().gesture;return [g.neighbor.row,g.neighbor.col];}),[3,2]);
await page.mouse.move(pos.x,pos.y);await page.mouse.up();await page.waitForFunction(()=>!Match3.game.state.getCurrentState().uiBlocked);
// A stationary press must not swap or self-swap.
const before=await page.evaluate(()=>JSON.stringify(Match3.game.state.getCurrentState().board.grid));await page.mouse.move(pos.x,pos.y);await page.mouse.down();await page.mouse.up();await page.waitForFunction(()=>!Match3.game.state.getCurrentState().uiBlocked);assert.equal(await page.evaluate(()=>JSON.stringify(Match3.game.state.getCurrentState().board.grid)),before);
async function findMove(valid){return page.evaluate(valid=>{const s=Match3.game.state.getCurrentState(),b=s.board;for(let r=0;r<6;r++)for(let c=0;c<6;c++)for(const [dr,dc] of [[1,0],[0,1]]){if(r+dr>=6||c+dc>=6)continue;const a={row:r,col:c},z={row:r+dr,col:c+dc};b.swap(a,z);const matches=b.findAllChains().length>0;b.swap(a,z);if(matches===valid)return {from:s.getBlockPositionRowCol({row:r,col:c}),to:s.getBlockPositionRowCol({row:r+dr,col:c+dc})};}},valid);}
const invalid=await findMove(false);const grid=await page.evaluate(()=>JSON.stringify(Match3.game.state.getCurrentState().board.grid));await page.mouse.move(invalid.from.x,invalid.from.y);await page.mouse.down();await page.mouse.move((invalid.from.x+invalid.to.x)/2,(invalid.from.y+invalid.to.y)/2);await page.mouse.up();assert(await page.evaluate(()=>Match3.game.state.getCurrentState().uiBlocked));await page.waitForFunction(()=>!Match3.game.state.getCurrentState().uiBlocked);assert.equal(await page.evaluate(()=>JSON.stringify(Match3.game.state.getCurrentState().board.grid)),grid);assert(await page.evaluate(()=>Match3.game.state.getCurrentState().blocks.children.some(b=>b.alive&&b.spring)));
let matches=0;for(let i=0;i<8;i++){const move=await findMove(true);if(!move)break;await page.mouse.move(move.from.x,move.from.y);await page.mouse.down();await page.mouse.move(move.to.x,move.to.y);await page.mouse.up();assert(await page.evaluate(()=>Match3.game.state.getCurrentState().uiBlocked));await page.waitForFunction(()=>!Match3.game.state.getCurrentState().uiBlocked,{},{timeout:20000});const state=await page.evaluate(()=>{const s=Match3.game.state.getCurrentState();return {count:s.blocks.countLiving(),chains:s.board.findAllChains().length,unique:new Set(s.blocks.children.filter(b=>b.alive).map(b=>b.row+','+b.col)).size,zero:s.board.grid.flat().includes(0)};});assert.deepEqual(state,{count:36,chains:0,unique:36,zero:false});matches++;}
// Release outside canvas still terminates the capture.
await page.mouse.move(pos.x,pos.y);await page.mouse.down();await page.mouse.move(1100,pos.y);await page.mouse.up();await page.waitForFunction(()=>!Match3.game.state.getCurrentState().gesture&&!Match3.game.state.getCurrentState().uiBlocked,{},{timeout:20000});
await page.waitForTimeout(1000);assert.deepEqual(errors,[]);
assert(await page.evaluate(()=>{const s=Match3.game.state.getCurrentState();return s.explosionCount>0&&s.counterText.textContent===String(s.explosionCount);}));
console.log({passed:['seam rejection','one-cell clamp','mirrored neighbor','atlas poses','selected on top','neighbor switching','stationary click','invalid move rollback','unlock during spring','match/cascade integrity','release outside'],matches,errors});
// Mobile pointer capture through touch pointer events, with CSS coordinate mapping.
await page.setViewportSize({width:390,height:844});await page.reload();await page.waitForFunction(()=>Match3.game.state.getCurrentState().blocks);
const mobile=await page.evaluate(()=>{const s=Match3.game.state.getCurrentState(),c=s.canvas,r=c.getBoundingClientRect(),p=s.getBlockPositionRowCol({row:2,col:2});return {x:r.left+p.x*r.width/s.game.width,y:r.top+p.y*r.height/s.game.height,pitch:s.PITCH*r.width/s.game.width};});
await page.mouse.move(mobile.x,mobile.y);await page.mouse.down();await page.mouse.move(mobile.x+mobile.pitch,mobile.y);assert(await page.evaluate(()=>!!Match3.game.state.getCurrentState().gesture.neighbor));await page.mouse.up();await page.waitForFunction(()=>!Match3.game.state.getCurrentState().uiBlocked,{},{timeout:20000});console.log('390px viewport: passed');
await browser.close();})();
