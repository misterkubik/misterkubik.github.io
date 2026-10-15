var Match3 = Match3 || {};
Match3.GameState = {
  init: function() {
    this.NUM_ROWS = 6;
    this.NUM_COLS = 6;
    this.NUM_VARIATIONS = 5;
    this.GAP = 8;
    this.BLOCK_SIZE = Math.max(12, (Math.min(this.game.width, this.game.height) * 0.8 - this.GAP * 5) / 6);
    this.PITCH = this.BLOCK_SIZE + this.GAP;
    this.uiBlocked = false;
    this.gesture = null;
    this.pendingDrops = [];
    this.running = true;
    this.hintQueue = null;
    this.hintCurrent = null;
    this.hintDeadline = performance.now() + 10000;
  },
  create: function() {
    var background = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'background');
    background.anchor.setTo(0.5);
    background.scale.setTo(Math.max(this.game.width / background.width, this.game.height / background.height));
    this.blocks = this.add.group();
    this.board = new Match3.Board(this, 6, 6, 5);
    this.sfx = { wobble: this.add.audio('wobble'), pops: [] };
    for (var i = 1; i <= 5; i++) this.sfx.pops.push(this.add.audio('pop' + i));
    this.popCounter = 0;
    for (var row = 0; row < 6; row++) for (var col = 0; col < 6; col++) {
      var pos = this.getBlockPositionRowCol({ row: row, col: col });
      var cell = this.add.sprite(pos.x, pos.y, 'cell');
      cell.anchor.setTo(0.5);
      cell.scale.setTo(this.BLOCK_SIZE / cell.width);
      cell.alpha = 0.2;
      this.createBlock(pos.x, pos.y, { row: row, col: col, asset: 'block' + this.board.grid[row][col] });
    }
    this.game.world.bringToTop(this.blocks);
    // One invisible DOM hit surface: the canvas. Individual sprites never receive input.
    this.canvas = this.game.canvas;
    this.oldTouchAction = this.canvas.style.touchAction;
    this.canvas.style.touchAction = 'none';
    this.handlers = {
      down: this.pointerDown.bind(this), move: this.pointerMove.bind(this),
      up: this.pointerUp.bind(this), cancel: this.pointerCancel.bind(this),
      blur: this.cancelGesture.bind(this)
    };
    this.canvas.addEventListener('pointerdown', this.handlers.down);
    window.addEventListener('pointermove', this.handlers.move);
    window.addEventListener('pointerup', this.handlers.up);
    window.addEventListener('pointercancel', this.handlers.cancel);
    this.canvas.addEventListener('lostpointercapture', this.handlers.cancel);
    window.addEventListener('blur', this.handlers.blur);
  },
  getBlockPositionRowCol: function(pos) {
    return { x: this.game.world.centerX + (pos.col - 2.5) * this.PITCH,
      y: this.game.world.centerY + (pos.row - 2.5) * this.PITCH };
  },
  createBlock: function(x, y, data) {
    var block = this.blocks.getFirstExists(false);
    if (block) block.reset(x, y, data);
    else { block = new Match3.Block(this, x, y, data); this.blocks.add(block); }
    return block;
  },
  getBlockFromColRow: function(pos) {
    return this.blocks.children.find(function(b) { return b.alive && b.row === pos.row && b.col === pos.col; });
  },
  pointerPosition: function(event) {
    var rect = this.canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * this.game.width / rect.width,
      y: (event.clientY - rect.top) * this.game.height / rect.height };
  },
  hitCell: function(pos) {
    var first = this.getBlockPositionRowCol({ row: 0, col: 0 });
    var x = pos.x - first.x + this.BLOCK_SIZE / 2;
    var y = pos.y - first.y + this.BLOCK_SIZE / 2;
    var col = Math.floor(x / this.PITCH), row = Math.floor(y / this.PITCH);
    if (col < 0 || col >= 6 || row < 0 || row >= 6 ||
      x - col * this.PITCH >= this.BLOCK_SIZE || y - row * this.PITCH >= this.BLOCK_SIZE) return null;
    return { row: row, col: col };
  },
  pointerDown: function(event) {
    this.resetHints();
    if (this.uiBlocked || this.gesture || (event.button !== undefined && event.button !== 0)) return;
    var cell = this.hitCell(this.pointerPosition(event));
    if (!cell) return;
    var block = this.getBlockFromColRow(cell);
    if (!block) return;
    event.preventDefault();
    this.stopMotion(block);
    block.x = block.origin.x; block.y = block.origin.y;
    this.blocks.bringToTop(block);
    this.scaleSelection(block, 1.12);
    var pointer = this.pointerPosition(event);
    this.gesture = { id: event.pointerId, block: block, neighbor: null,
      down: pointer, downTime: performance.now(), maxTravel: 0,
      previous: pointer, previousTime: performance.now(), vx: 0, vy: 0 };
    block.pose(0, 0);
    this.canvas.setPointerCapture(event.pointerId);
    this.pointerMove(event);
  },
  pointerMove: function(event) {
    var g = this.gesture;
    if (!g || g.id !== event.pointerId) return;
    var pos = this.pointerPosition(event), block = g.block;
    var now = performance.now();
    g.maxTravel = Math.max(g.maxTravel, Math.hypot(pos.x - g.down.x, pos.y - g.down.y));
    var seconds = Math.max((now - g.previousTime) / 1000, 0.008);
    var blend = 1 - Math.exp(-seconds / 0.035);
    g.vx += ((pos.x - g.previous.x) / seconds - g.vx) * blend;
    g.vy += ((pos.y - g.previous.y) / seconds - g.vy) * blend;
    g.previous = pos;
    g.previousTime = now;
    var dx = pos.x - block.origin.x, dy = pos.y - block.origin.y;
    var horizontal = Math.abs(dx) >= Math.abs(dy);
    var amount = horizontal ? dx : dy;
    var sign = amount < 0 ? -1 : 1;
    var threshold = this.PITCH * 0.10;
    var candidate = this.getBlockFromColRow({
      row: block.row + (horizontal ? 0 : sign), col: block.col + (horizontal ? sign : 0)
    });
    var neighbor = Math.abs(amount) > threshold ? candidate : null;
    if (neighbor !== g.neighbor) {
      if (g.neighbor) this.land(g.neighbor, g.neighbor.origin, 120);
      g.neighbor = neighbor;
      if (neighbor) this.stopMotion(neighbor);
    }
    var displacement = candidate ? Math.max(-this.PITCH, Math.min(this.PITCH, amount)) : 0;
    var x = horizontal ? displacement : 0, y = horizontal ? 0 : displacement;
    block.x = block.origin.x + x; block.y = block.origin.y + y;
    var cursorDistance = Math.hypot(dx, dy);
    g.farDrag = neighbor && cursorDistance > this.PITCH * 1.5 ? {
      x: dx / cursorDistance, y: dy / cursorDistance
    } : null;
    g.neighborResponse = Math.max(0, Math.min(1, (Math.abs(displacement) - threshold) / (this.PITCH - threshold)));
    this.poseGesture(g);
    if (neighbor) {
      var mirror = sign * this.PITCH * g.neighborResponse;
      neighbor.x = neighbor.origin.x - (horizontal ? mirror : 0);
      neighbor.y = neighbor.origin.y - (horizontal ? 0 : mirror);
      // The same pointer velocity, mirrored for the neighboring object.
      this.poseGesture(g);
    }
    this.blocks.bringToTop(block);
  },
  poseGesture: function(g) {
    // Six cell pitches per second reaches the outer atlas angle.
    var speedForFullTilt = this.PITCH * 6;
    var speed = Math.hypot(g.vx, g.vy);
    var factor = this.PITCH / Math.max(speedForFullTilt, speed);
    var x = g.vx * factor, y = g.vy * factor;
    if (g.farDrag) {
      var extraDistance = this.PITCH * 0.25 * Math.min(1, speed / speedForFullTilt);
      g.block.x = g.neighbor.origin.x + g.farDrag.x * extraDistance;
      g.block.y = g.neighbor.origin.y + g.farDrag.y * extraDistance;
      var atlasExtent = this.PITCH / Math.max(Math.abs(g.farDrag.x), Math.abs(g.farDrag.y));
      g.block.pose(g.farDrag.x * atlasExtent, g.farDrag.y * atlasExtent);
    } else g.block.pose(x, y);
    if (g.neighbor) g.neighbor.pose(-x * g.neighborResponse, -y * g.neighborResponse);
  },
  pointerUp: function(event) {
    if (!this.gesture || this.gesture.id !== event.pointerId) return;
    this.pointerMove(event);
    this.finishGesture(false);
  },
  pointerCancel: function(event) {
    if (this.gesture && this.gesture.id === event.pointerId) this.finishGesture(true);
  },
  cancelGesture: function() { if (this.gesture) this.finishGesture(true); },
  finishGesture: async function(cancelled) {
    var g = this.gesture;
    this.gesture = null;
    this.uiBlocked = true;
    if (this.canvas.hasPointerCapture(g.id)) this.canvas.releasePointerCapture(g.id);
    var block = g.block, neighbor = g.neighbor;
    this.scaleSelection(block, 1);
    if (!cancelled && g.maxTravel <= 6 && performance.now() - g.downTime <= 500) {
      this.stopMotion(block);
      block.x = block.origin.x; block.y = block.origin.y;
      if (neighbor) {
        this.stopMotion(neighbor);
        neighbor.x = neighbor.origin.x; neighbor.y = neighbor.origin.y; neighbor.pose(0, 0);
      }
      var dx = g.down.x - block.origin.x, dy = g.down.y - block.origin.y;
      var length = Math.hypot(dx, dy);
      if (length < 2) { var angle = Math.random() * Math.PI * 2; dx = Math.cos(angle); dy = Math.sin(angle); length = 1; }
      block.tapRing = { start: performance.now(), x: dx / length, y: dy / length };
      this.uiBlocked = false;
      return;
    }
    var distance = Math.hypot(block.x - block.origin.x, block.y - block.origin.y);
    var valid = false;
    var swapVector = neighbor ? { x: neighbor.origin.x - block.origin.x, y: neighbor.origin.y - block.origin.y } : null;
    // Commit only a deliberate drag; keep the existing match detector and board rules.
    if (!cancelled && neighbor && distance >= this.PITCH * 0.25) {
      this.board.swap(block, neighbor);
      valid = this.board.findAllChains().length > 0;
      if (valid) {
        var oldOrigin = block.origin; block.origin = neighbor.origin; neighbor.origin = oldOrigin;
        this.sfx.wobble.play();
      } else this.board.swap(block, neighbor);
    }
    await Promise.all([
      this.land(block, block.origin, 170, 0, false, valid ? swapVector : null),
      neighbor ? this.land(neighbor, neighbor.origin, 170, 0, false, valid ? { x: -swapVector.x, y: -swapVector.y } : null) : Promise.resolve()
    ]);
    if (!this.running) return;
    if (valid) await this.resolveBoard(block);
    else this.uiBlocked = false;
  },
  scaleSelection: function(block, factor) {
    if (block.selectionTween) block.selectionTween.stop();
    block.selectionTween = this.add.tween(block.scale).to({
      x: block.backedScale * factor, y: block.backedScale * factor
    }, 100, Phaser.Easing.Quadratic.Out, true);
  },
  stopMotion: function(block) {
    block.tapRing = null;
    if (block.motion) { block.motion.tween.stop(); block.motion.resolve(); block.motion = null; }
    block.spring = null;
  },
  land: function(block, target, duration, delay, falling, momentum) {
    this.stopMotion(block);
    var self = this, start = { x: block.x, y: block.y };
    var dx = target.x - start.x, dy = target.y - start.y;
    block.origin = { x: target.x, y: target.y };
    return new Promise(function(resolve) {
      var progress = { value: 0 };
      var tween = self.add.tween(progress).to({ value: 1 }, duration, Phaser.Easing.Quadratic.InOut, false, delay || 0);
      block.motion = { tween: tween, resolve: resolve, progress: progress, start: start, target: block.origin };
      tween.onComplete.addOnce(function() {
        block.motion = null;
        block.x = target.x; block.y = target.y;
        var inertiaX = momentum ? momentum.x : dx;
        var inertiaY = momentum ? momentum.y : dy;
        var distance = Math.hypot(inertiaX, inertiaY);
        if (distance > 0.5) {
          // Velocity produces an overshoot bounded to half a cell, followed by damped oscillation.
          var amplitude = Math.min(self.BLOCK_SIZE * (falling ? 0.22 : 0.45), Math.max(self.BLOCK_SIZE * 0.035, distance * 0.2));
          block.spring = { x: 0, y: 0, vx: inertiaX / distance * amplitude * 22, vy: inertiaY / distance * amplitude * 22 };
        } else block.pose(0, 0);
        resolve();
      });
      tween.start();
    });
  },
  wait: function(ms) {
    var self = this;
    return new Promise(function(resolve) { self.time.events.add(ms, resolve); });
  },
  explode: async function(block, delay, ready) {
    await this.wait(delay);
    var home = { x: block.origin.x, y: block.origin.y };
    block.shake = true;
    await this.wait(100);
    block.shake = null;
    block.row = null; block.col = null;
    ready();
    this.sfx.pops[this.popCounter++ % this.sfx.pops.length].play();
    var emitter = this.add.emitter(home.x, home.y, 10);
    emitter.makeParticles('cloud');
    emitter.minParticleSpeed.setTo(-210, -210); emitter.maxParticleSpeed.setTo(210, 210);
    emitter.gravity = 0; emitter.setAlpha(0.7, 0, 450); emitter.setScale(1.35, 0, 1.35, 0, 450);
    emitter.start(true, 450, null, 10);
    emitter.forEachAlive(function(particle) {
      // Give each particle its own scale curve, retaining the shrink-to-zero animation.
      var size = 0.35 + Math.random() * 1.65;
      particle.setScaleData(emitter.scaleData.map(function(frame) {
        return { x: frame.x * size, y: frame.y * size };
      }));
    });
    this.time.events.add(500, function() { emitter.destroy(); });
    var scale = this.add.tween(block.scale).to({ x: 0, y: 0 }, 120, Phaser.Easing.Back.In, true);
    await new Promise(function(resolve) { scale.onComplete.addOnce(resolve); });
    block.row = null; block.col = null;
    Phaser.Sprite.prototype.kill.call(block);
  },
  resolveBoard: async function(interactionBlock) {
    var impact = { row: interactionBlock.row, col: interactionBlock.col };
    while (this.running) {
      var chains = this.board.findAllChains();
      if (!chains.length) { this.uiBlocked = false; return; }
      var self = this;
      chains.sort(function(a, b) {
        var aa = a.row === interactionBlock.row && a.col === interactionBlock.col;
        var bb = b.row === interactionBlock.row && b.col === interactionBlock.col;
        if (aa !== bb) return aa ? -1 : 1;
        return Math.hypot(a.row - impact.row, a.col - impact.col) - Math.hypot(b.row - impact.row, b.col - impact.col);
      });
      var vacancies = [];
      var explosions = chains.map(function(cell, index) {
        self.board.grid[cell.row][cell.col] = 0;
        var block = self.getBlockFromColRow(cell);
        var delay = index === 0 ? 0 : Math.hypot(cell.row - impact.row, cell.col - impact.col) * 35;
        var ready;
        vacancies.push(new Promise(function(resolve) { ready = resolve; }));
        return self.explode(block, delay, ready);
      });
      await Promise.all(vacancies);
      this.pendingDrops = [];
      this.board.updateGrid();
      await Promise.all(this.pendingDrops.concat(explosions));
      // All logical landings complete; springs may continue while the next cascade is checked.
    }
  },
  dropDelay: function(targetRow, col) {
    // Bottom destination cells fill first; each higher destination adds 25 ms.
    return (this.NUM_ROWS - 1 - targetRow) * 25 + col * 18;
  },
  dropBlock: function(sourceRow, targetRow, col) {
    var block = this.getBlockFromColRow({ row: sourceRow, col: col });
    block.row = targetRow;
    var target = this.getBlockPositionRowCol({ row: targetRow, col: col });
    this.pendingDrops.push(this.land(block, target, 220 + (targetRow - sourceRow) * 35, this.dropDelay(targetRow, col), true));
  },
  dropReserveBlock: function(sourceRow, targetRow, col) {
    var source = this.getBlockPositionRowCol({ row: sourceRow - this.NUM_ROWS, col: col });
    var target = this.getBlockPositionRowCol({ row: targetRow, col: col });
    var block = this.createBlock(source.x, source.y, { row: targetRow, col: col, asset: 'block' + this.board.grid[targetRow][col] });
    this.pendingDrops.push(this.land(block, target, 220 + (targetRow + this.NUM_ROWS - sourceRow) * 35, this.dropDelay(targetRow, col), true));
  },
  resetHints: function() {
    if (this.hintCurrent) {
      var block = this.hintCurrent.block;
      block.x = block.origin.x; block.y = block.origin.y; block.pose(0, 0);
    }
    this.hintCurrent = null;
    this.hintQueue = null;
    this.hintDeadline = performance.now() + 10000;
  },
  winningCells: function() {
    var grid = this.board.grid, cells = {}, self = this;
    for (var row = 0; row < this.NUM_ROWS; row++) for (var col = 0; col < this.NUM_COLS; col++) {
      [[1, 0], [0, 1]].forEach(function(direction) {
        var r = row + direction[0], c = col + direction[1];
        if (r >= self.NUM_ROWS || c >= self.NUM_COLS) return;
        var old = grid[row][col]; grid[row][col] = grid[r][c]; grid[r][c] = old;
        var matches;
        try { matches = self.board.findAllChains(); }
        finally { grid[r][c] = grid[row][col]; grid[row][col] = old; }
        matches.forEach(function(cell) {
          // Match coordinates are after the swap; map them back to the current objects.
          var original = cell;
          if (cell.row === row && cell.col === col) original = { row: r, col: c };
          else if (cell.row === r && cell.col === c) original = { row: row, col: col };
          var key = original.row + ',' + original.col;
          if (!cells[key]) cells[key] = { row: original.row, col: original.col, directions: [] };
          var destination;
          if (original.row === row && original.col === col) destination = { row: r, col: c };
          else if (original.row === r && original.col === c) destination = { row: row, col: col };
          else destination = Math.hypot(original.row - row, original.col - col) < Math.hypot(original.row - r, original.col - c) ? { row: row, col: col } : { row: r, col: c };
          var dx = destination.col - original.col, dy = destination.row - original.row;
          var length = Math.hypot(dx, dy) || 1;
          cells[key].directions.push({ x: dx / length, y: dy / length });
        });
      });
    }
    var result = Object.keys(cells).map(function(key) { return cells[key]; });
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i]; result[i] = result[j]; result[j] = temp;
    }
    return result;
  },
  updateHints: function() {
    var now = performance.now();
    if (this.uiBlocked || this.gesture) { this.resetHints(); return; }
    if (this.hintCurrent) {
      if (now - this.hintCurrent.start < 1300) return;
      var block = this.hintCurrent.block;
      block.x = block.origin.x; block.y = block.origin.y; block.pose(0, 0);
      this.hintCurrent = null;
      this.hintNext = now + 300;
    }
    if (!this.hintQueue) {
      if (now < this.hintDeadline) return;
      this.hintQueue = this.winningCells();
      this.hintNext = now;
    }
    if (now < this.hintNext) return;
    if (!this.hintQueue.length) { this.resetHints(); return; }
    var cell = this.hintQueue.shift();
    var candidate = this.getBlockFromColRow(cell);
    if (candidate) {
      var direction = cell.directions[Math.floor(Math.random() * cell.directions.length)];
      var angle = Math.random() * Math.PI * 2;
      var x = direction.x + Math.cos(angle) * 0.65;
      var y = direction.y + Math.sin(angle) * 0.65;
      var length = Math.hypot(x, y);
      this.hintCurrent = { block: candidate, start: now, x: x / length, y: y / length };
    }
  },
  update: function() {
    var dt = Math.min(this.time.elapsedMS / 1000, 0.025), self = this;
    this.updateHints();
    if (this.gesture) {
      var g = this.gesture;
      // A stationary cursor stops emitting move events; relax back to the central frame.
      if (performance.now() - g.previousTime > 40) {
        var decay = Math.exp(-dt / 0.065);
        g.vx *= decay; g.vy *= decay;
      }
      this.poseGesture(g);
    }
    this.blocks.forEachAlive(function(block) {
      if (block.motion) {
        var m = block.motion, p = m.progress.value;
        block.x = m.start.x + (m.target.x - m.start.x) * p;
        block.y = m.start.y + (m.target.y - m.start.y) * p;
        block.pose(block.x - m.target.x, block.y - m.target.y);
        return;
      }
      var samples = [];
      if (block.spring) {
        var spring = block.spring;
        spring.vx += (-400 * spring.x - 13 * spring.vx) * dt;
        spring.vy += (-400 * spring.y - 13 * spring.vy) * dt;
        spring.x += spring.vx * dt; spring.y += spring.vy * dt;
        var limit = self.BLOCK_SIZE * 0.5;
        spring.x = Math.max(-limit, Math.min(limit, spring.x));
        spring.y = Math.max(-limit, Math.min(limit, spring.y));
        if (Math.hypot(spring.x, spring.y) < 0.2 && Math.hypot(spring.vx, spring.vy) < 2) {
          block.spring = null; spring.x = 0; spring.y = 0;
        }
        samples.push({ x: spring.x, y: spring.y, poseX: spring.x * 2.47, poseY: spring.y * 2.47 });
      }
      if (block.shake) {
        var shakeX = Math.sin(self.time.now * 0.09) * self.BLOCK_SIZE * 0.035;
        var shakeY = Math.cos(self.time.now * 0.11) * self.BLOCK_SIZE * 0.025;
        samples.push({ x: shakeX, y: shakeY, poseX: shakeX * 1.33, poseY: shakeY * 1.33 });
      }
      if (block.tapRing) {
        var tap = block.tapRing, elapsed = (performance.now() - tap.start) / 1000;
        var tilt = Math.cos(elapsed * 48) * Math.exp(-elapsed * 6) * self.PITCH * 1.12;
        if (elapsed >= 0.65) { block.tapRing = null; tilt = 0; }
        samples.push({ x: 0, y: 0, poseX: tap.x * tilt, poseY: tap.y * tilt });
      }
      if (self.hintCurrent && self.hintCurrent.block === block) {
        var hint = self.hintCurrent;
        var t = (performance.now() - hint.start) / 1000;
        var ring = Math.sin(t * 24) * Math.exp(-t * 2.5) * 0.3;
        samples.push({ x: ring * self.BLOCK_SIZE * 0.045 * hint.x,
          y: ring * self.BLOCK_SIZE * 0.045 * hint.y,
          poseX: ring * self.PITCH * 0.65 * hint.x, poseY: ring * self.PITCH * 0.65 * hint.y });
      }
      if (samples.length) {
        // Blend continuous offsets first, then choose a single atlas frame.
        var combined = { x: 0, y: 0, poseX: 0, poseY: 0 };
        samples.forEach(function(sample) {
          combined.x += sample.x; combined.y += sample.y;
          combined.poseX += sample.poseX; combined.poseY += sample.poseY;
        });
        block.x = block.origin.x + combined.x / samples.length;
        block.y = block.origin.y + combined.y / samples.length;
        block.pose(combined.poseX / samples.length, combined.poseY / samples.length);
      }
    });
  },
  shutdown: function() {
    this.running = false;
    this.canvas.removeEventListener('pointerdown', this.handlers.down);
    window.removeEventListener('pointermove', this.handlers.move);
    window.removeEventListener('pointerup', this.handlers.up);
    window.removeEventListener('pointercancel', this.handlers.cancel);
    this.canvas.removeEventListener('lostpointercapture', this.handlers.cancel);
    window.removeEventListener('blur', this.handlers.blur);
    this.canvas.style.touchAction = this.oldTouchAction;
  }
};
