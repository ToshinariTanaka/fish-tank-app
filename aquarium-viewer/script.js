(() => {
  'use strict';

  const canvas = document.getElementById('aquarium');
  const ctx = canvas.getContext('2d');
  const app = document.querySelector('.app');
  const panel = document.getElementById('controlPanel');
  const controls = {
    fishCount: document.getElementById('fishCount'),
    bubbleCount: document.getElementById('bubbleCount'),
    fishCountValue: document.getElementById('fishCountValue'),
    bubbleCountValue: document.getElementById('bubbleCountValue'),
    showNames: document.getElementById('showNames'),
    timeMode: document.getElementById('timeMode'),
    feedMany: document.getElementById('feedManyButton'),
    fullscreen: document.getElementById('fullscreenButton'),
    hidePanel: document.getElementById('hidePanelButton'),
    showPanel: document.getElementById('showPanelButton'),
  };

  const STORAGE_KEY = 'calmAquariumSettings';
  const MAX_FOOD = 80;
  const NAMES = ['ごんべ', 'ゾロカンス', 'ミレス', 'ルナ', 'しずく', 'アオ', 'こはく', 'ナギ', 'マリン', 'ポポ'];
  const FISH_SHAPES = {
    goldfish: {
      shape: 'goldfish', body: '#ffb45f', fin: '#ff784d', stripe: '#ffe1a8',
      sprite: 'assets/fish/goldfish.webp', spriteFrames: 7, spriteWidth: 112, spriteHeight: 75, tailBeatsPerSecond: 1.25,
      glideSeconds: [1.3, 2.3], glideSpeedRatio: 0.33, turnRate: 2.6,
      sizeMin: 0.86, sizeMax: 1.18, speedMin: 22, speedMax: 38,
      depthMin: 0.38, depthMax: 0.62, bobAmountMin: 6, bobAmountMax: 13, foodChaseMultiplier: 0.9,
    },
    angelfish: {
      shape: 'angelfish', body: '#d6a4ff', fin: '#8957ff', stripe: '#fff0ff',
      sprite: 'assets/fish/angelfish.webp', spriteFrames: 7, spriteWidth: 88, spriteHeight: 107, tailBeatsPerSecond: 0.85,
      glideSeconds: [1.3, 2.0], glideSpeedRatio: 0.38, turnRate: 3.2,
      sizeMin: 0.82, sizeMax: 1.12, speedMin: 18, speedMax: 34,
      depthMin: 0.34, depthMax: 0.60, bobAmountMin: 4, bobAmountMax: 10, foodChaseMultiplier: 0.82,
    },
    minnow: {
      shape: 'minnow', body: '#8ee6ff', fin: '#4aa8ff', stripe: '#e5fbff',
      sprite: 'assets/fish/minnow.webp', spriteFrames: 3, spriteWidth: 105, spriteHeight: 32, tailBeatsPerSecond: 2.1,
      glideSeconds: [0.35, 0.85], glideSpeedRatio: 0.5, turnRate: 6.0,
      sizeMin: 0.58, sizeMax: 0.88, speedMin: 48, speedMax: 78,
      depthMin: 0.20, depthMax: 0.48, bobAmountMin: 3, bobAmountMax: 8, foodChaseMultiplier: 1.18,
    },
    puffer: {
      shape: 'puffer', body: '#ffd76e', fin: '#ff9f43', stripe: '#fff6ba',
      sprite: 'assets/fish/puffer.webp', spriteFrames: 3, spriteWidth: 85, spriteHeight: 59, tailBeatsPerSecond: 1.4,
      glideSeconds: [0.7, 1.4], glideSpeedRatio: 0.35, turnRate: 4.3,
      sizeMin: 0.74, sizeMax: 1.02, speedMin: 18, speedMax: 32,
      depthMin: 0.38, depthMax: 0.66, bobAmountMin: 10, bobAmountMax: 21, foodChaseMultiplier: 0.78,
    },
    catfish: {
      shape: 'catfish', body: '#9fbe9b', fin: '#5d8d72', stripe: '#e8f2da',
      sprite: 'assets/fish/catfish.webp', spriteFrames: 3, spriteWidth: 130, spriteHeight: 42, tailBeatsPerSecond: 1.05,
      glideSeconds: [0.9, 2.1], glideSpeedRatio: 0.48, turnRate: 3.8,
      sizeMin: 0.82, sizeMax: 1.10, speedMin: 28, speedMax: 48,
      depthMin: 0.64, depthMax: 0.78, bobAmountMin: 4, bobAmountMax: 9, foodChaseMultiplier: 0.96,
    },
  };

  const FISH_TYPES = [
    FISH_SHAPES.goldfish,
    FISH_SHAPES.angelfish,
    FISH_SHAPES.minnow,
    FISH_SHAPES.puffer,
    FISH_SHAPES.catfish,
  ];

  const NAMED_FISH_CONFIG = {
    ごんべ: {
      ...FISH_SHAPES.goldfish,
      glideSeconds: [1.8, 3.2], glideSpeedRatio: 0.25, turnRate: 2.1,
      sizeMin: 0.92, sizeMax: 1.02, speedMin: 20, speedMax: 30,
      bobAmountMin: 5, bobAmountMax: 10, foodChaseMultiplier: 0.86,
    },
    ゾロカンス: {
      ...FISH_SHAPES.minnow,
      aimSeconds: 0.26,
      sprite: 'assets/fish/zorokansu.webp', spriteWidth: 142, spriteHeight: 34, tailBeatsPerSecond: 1.65,
      body: '#6fb7d8', fin: '#2f6f9e', stripe: '#d9f7ff',
      sizeMin: 1.22, sizeMax: 1.42, speedMin: 70, speedMax: 96,
      depthMin: 0.24, depthMax: 0.58, bobAmountMin: 3, bobAmountMax: 7, foodChaseMultiplier: 1.55,
    },
    ミレス: {
      ...FISH_SHAPES.angelfish,
      hover: true, glideSeconds: [2.5, 4.0], glideSpeedRatio: 0,
      body: '#ceb0ff', fin: '#7d61d5', stripe: '#fff8ff',
      sizeMin: 0.92, sizeMax: 1.04, speedMin: 18, speedMax: 28,
      depthMin: 0.38, depthMax: 0.56, bobAmountMin: 3, bobAmountMax: 7, foodChaseMultiplier: 0.78,
    },
  };

  const fishSprites = new Map();

  async function preloadFishSprites() {
    const types = [...FISH_TYPES, ...Object.values(NAMED_FISH_CONFIG)];
    const paths = new Set(types.map((type) => type.sprite));
    await Promise.all(Array.from(paths, async (path) => {
      const image = new Image();
      image.src = path;
      try {
        await image.decode();
        fishSprites.set(path, image);
      } catch {
        // 読み込めなかった魚だけ、従来の Canvas 描画を使う。
      }
    }));
  }

  const TIME_THEMES = {
    day: {
      top: '#6ed5ff', mid: '#147cc0', bottom: '#06395e', sand: '#d7be81', glow: 'rgba(210, 246, 255, 0.24)', overlay: 'rgba(255, 255, 255, 0)',
    },
    evening: {
      top: '#6eb8d6', mid: '#21699b', bottom: '#123551', sand: '#c99f65', glow: 'rgba(255, 184, 112, 0.22)', overlay: 'rgba(255, 126, 67, 0.14)',
    },
    night: {
      top: '#173c68', mid: '#082a4d', bottom: '#031a32', sand: '#8e8164', glow: 'rgba(116, 177, 255, 0.18)', overlay: 'rgba(0, 11, 38, 0.34)',
    },
  };

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    fish: [],
    bubbles: [],
    foods: [],
    plants: [],
    rocks: [],
    driftwoods: [],
    lastTime: performance.now(),
    settings: loadSettings(),
  };

  class Fish {
    constructor(index, width, height) {
      this.name = NAMES[index % NAMES.length];
      this.type = NAMED_FISH_CONFIG[this.name] || FISH_TYPES[index % FISH_TYPES.length];
      this.shape = this.type.shape;
      this.bodyColor = this.type.body;
      this.finColor = this.type.fin;
      this.stripeColor = this.type.stripe;
      this.size = random(this.type.sizeMin, this.type.sizeMax);
      this.length = 58 * this.size;
      this.spriteWidth = this.type.spriteWidth * this.size;
      this.spriteHeight = this.type.spriteHeight * this.size;
      const initialSpeed = random(this.type.speedMin, this.type.speedMax) * (Math.random() > 0.5 ? 1 : -1);
      this.cruiseSpeed = Math.abs(initialSpeed);
      this.direction = initialSpeed >= 0 ? 1 : -1;
      this.speed = this.direction * this.cruiseSpeed;
      this.x = random(70, Math.max(90, width - 70));
      this.baseY = this.randomDepth(height);
      this.y = this.baseY;
      this.phase = random(0, Math.PI * 2);
      this.bobAmount = random(this.type.bobAmountMin, this.type.bobAmountMax);
      this.bobSpeed = this.shape === 'angelfish' ? random(0.55, 1.0) : random(0.8, 1.7);
      this.heading = this.direction; // 旋回中は -1〜1 の間を連続的に移る。
      this.forwardSpeed = this.cruiseSpeed;
      this.pitch = 0;
      this.beatsPerBout = Math.random() < 0.5 ? 2 : 3;
      this.beats = random(0, this.beatsPerBout);
      this.glideLeft = 0;
      this.aimLeft = 0;
      this.tailBend = Math.sin(this.beats * Math.PI * 2);
      this.targetFood = null;
    }

    randomDepth(height) {
      const min = this.type.depthMin;
      const max = this.type.depthMax;
      return random(height * min, height * max);
    }

    clampDepth(height) {
      const sandTop = height * 0.84;
      const minY = Math.max(height * 0.13, height * this.type.depthMin);
      const maxY = Math.min(sandTop - this.length * 0.28, height * this.type.depthMax);
      return { minY, maxY: Math.max(minY, maxY) };
    }

    // 尾を2、3回振り切ると中立姿勢で滑走する。周期は個体ごとにずらす。
    cruise(dt, time) {
      if (this.glideLeft > 0) {
        this.glideLeft = Math.max(0, this.glideLeft - dt);
        this.tailBend = this.type.hover ? Math.sin(time * 3.5 + this.phase) * 0.85 : 0;
        if (this.glideLeft === 0) {
          this.beatsPerBout = Math.random() < 0.5 ? 2 : 3;
          if (Math.random() < 0.22) this.direction *= -1;
        }
        return this.cruiseSpeed * this.type.glideSpeedRatio;
      }

      this.beats += dt * this.type.tailBeatsPerSecond;
      if (this.beats >= this.beatsPerBout) {
        this.beats = 0;
        this.glideLeft = random(...this.type.glideSeconds);
      }
      this.tailBend = Math.sin(this.beats * Math.PI * 2);
      return this.cruiseSpeed;
    }

    update(dt, time, width, height, foods) {
      const depth = this.clampDepth(height);
      this.baseY = clamp(this.baseY, depth.minY, depth.maxY);
      const previousFood = this.targetFood;
      this.targetFood = findNearestFood(this, foods);
      let desiredSpeed;
      let response = 3.4;
      let turnRate = this.type.turnRate;
      let targetPitch;
      let verticalSpeed;

      if (this.targetFood) {
        if (this.targetFood !== previousFood) this.aimLeft = this.type.aimSeconds || 0;
        const dx = this.targetFood.x - this.x;
        const dy = this.targetFood.y - this.y;
        const chase = this.type.foodChaseMultiplier;
        if (Math.abs(dx) > 2) this.direction = Math.sign(dx);
        targetPitch = clamp(Math.atan2(dy, Math.max(this.length * 0.4, Math.abs(dx))), -0.48, 0.48);
        if (this.aimLeft > 0) {
          // ゾロカンスはまず鼻先を向ける。照準中もわずかに惰性が残る。
          this.aimLeft = Math.max(0, this.aimLeft - dt);
          desiredSpeed = 0;
          verticalSpeed = 0;
          turnRate = 14;
          response = 14;
          this.tailBend = 0;
        } else {
          desiredSpeed = Math.min(105 * this.size * chase, Math.abs(dx) * 2 * chase);
          verticalSpeed = clamp(dy * 2.6 * chase, -80 * chase, 80 * chase);
          response = this.type.aimSeconds ? 9 : 4;
          this.beats = (this.beats + dt * this.type.tailBeatsPerSecond * (1 + chase)) % 1;
          this.tailBend = Math.sin(this.beats * Math.PI * 2);
        }
      } else {
        if (previousFood) {
          this.glideLeft = 0;
          this.beats = 0;
          this.aimLeft = 0;
        }
        desiredSpeed = this.cruise(dt, time);
        const hovering = this.type.hover && this.glideLeft > 0;
        if (hovering) {
          verticalSpeed = Math.cos(time * 1.5 + this.phase) * 0.8;
          response = 4.5;
        } else {
          const targetY = this.baseY + Math.sin(time * this.bobSpeed + this.phase) * this.bobAmount;
          verticalSpeed = clamp((targetY - this.y) * 1.8, -45, 45);
          if (this.glideLeft > 0) response = 1.2;
        }
        targetPitch = clamp(verticalSpeed / this.cruiseSpeed * 0.35, -0.24, 0.24);
      }

      const margin = Math.min(width * 0.42, this.spriteWidth / 2 + this.cruiseSpeed / turnRate * 0.45);
      if (this.x < margin || this.x > width - margin) {
        this.direction = this.x < margin ? 1 : -1;
        desiredSpeed = this.cruiseSpeed;
        this.glideLeft = 0;
      }
      this.heading += (this.direction - this.heading) * (1 - Math.exp(-turnRate * dt));
      this.forwardSpeed += (desiredSpeed - this.forwardSpeed) * (1 - Math.exp(-response * dt));
      this.speed = this.heading * this.forwardSpeed;
      this.pitch += (targetPitch - this.pitch) * (1 - Math.exp(-turnRate * dt));
      const turnArc = (1 - this.heading * this.heading) * 12 * Math.sin(this.phase);
      this.x = clamp(this.x + this.speed * dt, this.spriteWidth / 2, width - this.spriteWidth / 2);
      this.y = clamp(this.y + (verticalSpeed + turnArc) * dt, height * 0.13, height * 0.82 - this.length * 0.12);
    }

    touchesFood(food) {
      // 鼻先から胴の中央までを当たり判定に含め、長い魚も口元で餌を取れる。
      const dx = food.x - this.x;
      const dy = food.y - this.y;
      const forwardX = (Math.sign(this.heading) || this.direction) * Math.cos(this.pitch);
      const forwardY = Math.sin(this.pitch);
      const reach = this.spriteWidth * 0.4 * Math.abs(this.heading);
      const along = clamp(dx * forwardX + dy * forwardY, 0, reach);
      return Math.hypot(dx - along * forwardX, dy - along * forwardY) < this.length * 0.22 + food.radius;
    }

    draw(context, showName) {
      context.save();
      context.translate(this.x, this.y);
      const facing = Math.sign(this.heading) || this.direction;
      context.rotate(this.pitch * facing);
      context.scale(facing * (0.20 + 0.80 * Math.abs(this.heading)), 1);
      const image = fishSprites.get(this.type.sprite);
      if (image) {
        const frame = Math.round((1 + this.tailBend) / 2 * (this.type.spriteFrames - 1));
        const frameWidth = image.naturalWidth / this.type.spriteFrames;
        context.drawImage(image, frame * frameWidth, 0, frameWidth, image.naturalHeight,
          -this.spriteWidth / 2, -this.spriteHeight / 2, this.spriteWidth, this.spriteHeight);
      } else {
        this.drawFallback(context);
      }
      context.restore();

      if (showName) {
        const height = image ? this.spriteHeight : this.length * 0.72;
        const width = image ? this.spriteWidth : this.length;
        const top = (height * Math.cos(this.pitch) + width * Math.abs(Math.sin(this.pitch))) / 2;
        this.drawName(context, top + 4);
      }
    }

    drawFallback(context) {
      if (this.shape === 'goldfish') this.drawGoldfish(context);
      else if (this.shape === 'angelfish') this.drawAngelfish(context);
      else if (this.shape === 'minnow') this.drawMinnow(context);
      else if (this.shape === 'puffer') this.drawPuffer(context);
      else if (this.shape === 'catfish') this.drawCatfish(context);
    }

    drawName(context, offset) {
      context.save();
      const fontSize = Math.max(12, 12 * this.size);
      const baseline = Math.max(fontSize, this.y - offset);
      context.font = `${fontSize}px sans-serif`;
      context.textAlign = 'center';
      context.fillStyle = 'rgba(1, 16, 25, 0.45)';
      context.fillText(this.name, this.x + 1, baseline + 1);
      context.fillStyle = 'rgba(240, 252, 255, 0.92)';
      context.fillText(this.name, this.x, baseline);
      context.restore();
    }

    getSwimBend() {
      return this.tailBend * 0.08;
    }

    makeBodyGradient(context, topColor, middleColor, bellyColor, height) {
      const gradient = context.createLinearGradient(0, -height, 0, height);
      gradient.addColorStop(0, topColor);
      gradient.addColorStop(0.46, middleColor);
      gradient.addColorStop(1, bellyColor);
      return gradient;
    }

    drawEye(context, x, y, radius) {
      const eyeGradient = context.createRadialGradient(x - radius * 0.25, y - radius * 0.25, radius * 0.2, x, y, radius);
      eyeGradient.addColorStop(0, '#ffffff');
      eyeGradient.addColorStop(0.34, '#dff8ff');
      eyeGradient.addColorStop(0.38, '#2d4f62');
      eyeGradient.addColorStop(1, '#061019');
      context.fillStyle = eyeGradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(255, 255, 255, 0.92)';
      context.beginPath();
      context.arc(x + radius * 0.28, y - radius * 0.34, radius * 0.28, 0, Math.PI * 2);
      context.fill();
    }

    drawFin(context, points, color = this.finColor, alpha = 0.72) {
      context.save();
      context.globalAlpha = alpha;
      const gradient = context.createLinearGradient(0, -this.length * 0.25, 0, this.length * 0.25);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0.28)');
      context.fillStyle = gradient;
      context.strokeStyle = 'rgba(80, 38, 22, 0.18)';
      context.lineWidth = Math.max(0.8, this.length * 0.012);
      context.beginPath();
      context.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i += 1) context.lineTo(points[i][0], points[i][1]);
      context.closePath();
      context.fill();
      context.stroke();
      context.restore();
    }

    drawGoldfish(context) {
      const length = this.length;
      const h = length * 0.48;
      const bend = this.getSwimBend();
      this.drawFin(context, [[-length * 0.34, 0], [-length * 0.76, -h * (0.82 + bend)], [-length * 0.63, -h * 0.08], [-length * 0.80, h * (0.82 - bend)]], this.finColor, 0.66);
      this.drawFin(context, [[-length * 0.04, -h * 0.52], [-length * 0.22, -h * 1.02], [length * 0.17, -h * 0.42]], this.finColor, 0.58);
      this.drawFin(context, [[length * 0.02, h * 0.40], [-length * 0.11, h * 0.82], [length * 0.23, h * 0.40]], this.finColor, 0.48);
      context.fillStyle = this.makeBodyGradient(context, '#d95f25', this.bodyColor, '#fff0c8', h * 0.58);
      context.beginPath();
      context.moveTo(-length * 0.42, 0);
      context.bezierCurveTo(-length * 0.32, -h * 0.58, length * 0.10, -h * 0.72, length * 0.39, -h * 0.16);
      context.bezierCurveTo(length * 0.49, h * 0.08, length * 0.25, h * 0.62, -length * 0.05, h * 0.64);
      context.bezierCurveTo(-length * 0.30, h * 0.62, -length * 0.48, h * 0.28, -length * 0.42, 0);
      context.fill();
      this.drawStripes(context, h, length);
      this.drawEye(context, length * 0.29, -h * 0.12, Math.max(2.4, length * 0.04));
    }

    drawAngelfish(context) {
      const length = this.length;
      const h = length * 0.76;
      const bend = this.getSwimBend();
      this.drawFin(context, [[-length * 0.31, 0], [-length * 0.66, -h * 0.26], [-length * 0.66, h * 0.26]], this.finColor, 0.58);
      this.drawFin(context, [[-length * 0.12, -h * 0.20], [length * 0.02 + bend * length, -h * 0.98], [length * 0.24, -h * 0.09]], this.finColor, 0.62);
      this.drawFin(context, [[-length * 0.10, h * 0.17], [length * 0.05 - bend * length, h * 1.03], [length * 0.25, h * 0.08]], this.finColor, 0.58);
      context.fillStyle = this.makeBodyGradient(context, '#7b5bc2', this.bodyColor, '#fff8ff', h * 0.45);
      context.beginPath();
      context.moveTo(-length * 0.35, 0);
      context.bezierCurveTo(-length * 0.21, -h * 0.47, length * 0.18, -h * 0.44, length * 0.36, -h * 0.02);
      context.bezierCurveTo(length * 0.21, h * 0.47, -length * 0.20, h * 0.49, -length * 0.35, 0);
      context.fill();
      this.drawVerticalBands(context, h * 0.84, length, 3);
      this.drawEye(context, length * 0.22, -h * 0.06, Math.max(2.2, length * 0.034));
    }

    drawMinnow(context) {
      const length = this.length;
      const h = length * 0.27;
      const bend = this.getSwimBend();
      this.drawFin(context, [[-length * 0.43, 0], [-length * 0.68, -h * (0.58 + bend)], [-length * 0.61, 0], [-length * 0.68, h * (0.58 - bend)]], this.finColor, 0.58);
      this.drawFin(context, [[-length * 0.05, -h * 0.50], [-length * 0.20, -h * 0.95], [length * 0.15, -h * 0.42]], this.finColor, 0.42);
      context.fillStyle = this.makeBodyGradient(context, '#2f8bb8', this.bodyColor, '#efffff', h * 0.62);
      context.beginPath();
      context.moveTo(-length * 0.46, 0);
      context.bezierCurveTo(-length * 0.25, -h * 0.62, length * 0.22, -h * 0.56, length * 0.45, -h * 0.08);
      context.bezierCurveTo(length * 0.28, h * 0.48, -length * 0.25, h * 0.54, -length * 0.46, 0);
      context.fill();
      context.strokeStyle = this.stripeColor;
      context.lineWidth = Math.max(1.2, length * 0.022);
      context.beginPath();
      context.moveTo(-length * 0.32, -h * 0.03);
      context.quadraticCurveTo(0, -h * 0.16, length * 0.34, -h * 0.03);
      context.stroke();
      this.drawEye(context, length * 0.32, -h * 0.17, Math.max(1.8, length * 0.031));
    }

    drawPuffer(context) {
      const length = this.length;
      const h = length * 0.57;
      this.drawFin(context, [[-length * 0.36, 0], [-length * 0.59, -h * 0.28], [-length * 0.58, h * 0.28]], this.finColor, 0.54);
      this.drawFin(context, [[length * 0.08, h * 0.20], [length * 0.24, h * 0.45], [length * 0.30, h * 0.12]], this.finColor, 0.48);
      context.fillStyle = this.makeBodyGradient(context, '#caa13b', this.bodyColor, '#fff7ba', h * 0.65);
      context.beginPath();
      context.moveTo(-length * 0.40, 0);
      context.bezierCurveTo(-length * 0.34, -h * 0.60, length * 0.22, -h * 0.70, length * 0.40, -h * 0.08);
      context.bezierCurveTo(length * 0.47, h * 0.26, length * 0.16, h * 0.65, -length * 0.14, h * 0.63);
      context.bezierCurveTo(-length * 0.34, h * 0.52, -length * 0.47, h * 0.20, -length * 0.40, 0);
      context.fill();
      this.drawSpots(context, length, h);
      this.drawEye(context, length * 0.25, -h * 0.13, Math.max(2.3, length * 0.036));
    }

    drawCatfish(context) {
      const length = this.length;
      const h = length * 0.31;
      const bend = this.getSwimBend();
      this.drawFin(context, [[-length * 0.46, 0], [-length * 0.66, -h * (0.38 + bend)], [-length * 0.64, h * (0.38 - bend)]], this.finColor, 0.48);
      this.drawFin(context, [[-length * 0.08, -h * 0.48], [-length * 0.24, -h * 0.92], [length * 0.10, -h * 0.38]], this.finColor, 0.38);
      context.fillStyle = this.makeBodyGradient(context, '#526f59', this.bodyColor, '#edf1d7', h * 0.62);
      context.beginPath();
      context.moveTo(-length * 0.48, 0);
      context.bezierCurveTo(-length * 0.22, -h * 0.58, length * 0.35, -h * 0.50, length * 0.48, -h * 0.10);
      context.bezierCurveTo(length * 0.54, h * 0.24, length * 0.16, h * 0.58, -length * 0.20, h * 0.52);
      context.bezierCurveTo(-length * 0.40, h * 0.44, -length * 0.55, h * 0.18, -length * 0.48, 0);
      context.fill();
      context.fillStyle = 'rgba(245, 245, 210, 0.42)';
      context.beginPath();
      context.ellipse(length * 0.02, h * 0.20, length * 0.35, h * 0.20, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = this.stripeColor;
      context.lineWidth = Math.max(1, length * 0.018);
      context.beginPath();
      context.moveTo(length * 0.31, h * 0.02);
      context.quadraticCurveTo(length * 0.56, -h * 0.40, length * 0.76, -h * 0.24);
      context.moveTo(length * 0.31, h * 0.08);
      context.quadraticCurveTo(length * 0.57, h * 0.46, length * 0.76, h * 0.32);
      context.moveTo(length * 0.28, h * 0.14);
      context.quadraticCurveTo(length * 0.50, h * 0.08, length * 0.67, h * 0.10);
      context.stroke();
      this.drawEye(context, length * 0.30, -h * 0.15, Math.max(1.9, length * 0.029));
    }

    drawVerticalBands(context, bodyHeight, length, count) {
      context.save();
      context.strokeStyle = this.stripeColor;
      context.globalAlpha = 0.62;
      context.lineWidth = Math.max(1.5, length * 0.035);
      for (let i = 0; i < count; i += 1) {
        const x = -length * 0.16 + i * length * 0.15;
        context.beginPath();
        context.moveTo(x, -bodyHeight * 0.42);
        context.quadraticCurveTo(x + length * 0.035, 0, x, bodyHeight * 0.42);
        context.stroke();
      }
      context.restore();
    }

    drawSpots(context, length, bodyHeight) {
      context.save();
      context.fillStyle = 'rgba(151, 111, 42, 0.32)';
      const spots = [[-0.16, -0.28, 0.035], [0.02, -0.36, 0.028], [0.15, -0.12, 0.032], [-0.02, 0.18, 0.026], [-0.24, 0.10, 0.023]];
      for (const [x, y, r] of spots) {
        context.beginPath();
        context.arc(length * x, bodyHeight * y, length * r, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    drawOvalBody(context, radiusX, radiusY) {
      context.fillStyle = this.bodyColor;
      context.beginPath();
      context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      context.fill();
    }

    drawStripes(context, bodyHeight, length) {
      context.strokeStyle = this.stripeColor;
      context.lineWidth = Math.max(1.5, length * 0.032);
      context.globalAlpha = 0.58;
      context.beginPath();
      context.moveTo(-length * 0.16, -bodyHeight * 0.34);
      context.quadraticCurveTo(-length * 0.05, 0, -length * 0.13, bodyHeight * 0.38);
      context.moveTo(length * 0.10, -bodyHeight * 0.28);
      context.quadraticCurveTo(length * 0.20, 0, length * 0.08, bodyHeight * 0.30);
      context.stroke();
      context.globalAlpha = 1;
    }
  }

  class Bubble {
    constructor(width, height) {
      this.reset(width, height, true);
    }

    reset(width, height, scatter = false) {
      this.x = random(width * 0.03, width * 0.97);
      this.y = scatter ? random(height * 0.12, height * 0.9) : height + random(6, 60);
      this.radius = random(1.3, 4.6);
      this.speed = random(18, 58);
      this.wobble = random(0.8, 2.4);
      this.phase = random(0, Math.PI * 2);
    }

    update(dt, time, width, height) {
      this.y -= this.speed * dt;
      this.x += Math.sin(time * this.wobble + this.phase) * dt * 10;
      if (this.y < height * 0.1) this.reset(width, height);
    }

    draw(context) {
      context.strokeStyle = 'rgba(222, 249, 255, 0.62)';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.stroke();
    }
  }

  class Food {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = random(3, 4.8);
      this.speed = random(18, 34);
      this.life = 11;
      this.phase = random(0, Math.PI * 2);
    }

    update(dt, time, height) {
      this.life -= dt;
      this.y += this.speed * dt;
      this.x += Math.sin(time * 2 + this.phase) * dt * 7;
      return this.life > 0 && this.y < height * 0.86;
    }

    draw(context) {
      context.fillStyle = 'rgba(123, 74, 28, 0.9)';
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  function loadSettings() {
    const defaults = { fishCount: 10, bubbleCount: 56, showNames: true, timeMode: 'auto', panelHidden: false };
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch (_error) {
      return defaults;
    }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function activeThemeName() {
    if (state.settings.timeMode !== 'auto') return state.settings.timeMode;
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 5) return 'night';
    if (hour >= 16) return 'evening';
    return 'day';
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const previousWidth = state.width;
    const previousHeight = state.height;
    state.width = Math.max(320, rect.width);
    state.height = Math.max(360, rect.height);
    for (const fish of state.fish) {
      fish.x *= state.width / previousWidth;
      fish.y *= state.height / previousHeight;
      fish.baseY *= state.height / previousHeight;
    }
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    buildDecorations();
  }

  function buildDecorations() {
    state.plants = Array.from({ length: 14 }, (_, index) => ({
      x: (index + 0.25 + Math.random() * 0.5) * state.width / 14,
      height: random(state.height * 0.11, state.height * 0.27),
      width: random(7, 14),
      phase: random(0, Math.PI * 2),
    }));
    state.rocks = Array.from({ length: 8 }, (_, index) => ({
      x: (index + Math.random()) * state.width / 8,
      y: state.height * random(0.83, 0.9),
      r: random(13, 32),
    }));
    state.driftwoods = [
      { x: state.width * 0.2, y: state.height * 0.82, w: state.width * 0.18, angle: -0.18 },
      { x: state.width * 0.72, y: state.height * 0.8, w: state.width * 0.22, angle: 0.12 },
    ];
  }

  function syncEntities() {
    while (state.fish.length < state.settings.fishCount) state.fish.push(new Fish(state.fish.length, state.width, state.height));
    state.fish.length = state.settings.fishCount;
    while (state.bubbles.length < state.settings.bubbleCount) state.bubbles.push(new Bubble(state.width, state.height));
    state.bubbles.length = state.settings.bubbleCount;
  }

  function findNearestFood(fish, foods) {
    let nearest = null;
    let nearestDistance = 170 * fish.size;
    const current = fish.targetFood;
    if (current && foods.includes(current) && Math.hypot(current.x - fish.x, current.y - fish.y) < nearestDistance) return current;
    for (const food of foods) {
      const distance = Math.hypot(food.x - fish.x, food.y - fish.y);
      if (distance < nearestDistance) {
        nearest = food;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  function addFood(x, y) {
    if (state.foods.length >= MAX_FOOD) state.foods.splice(0, state.foods.length - MAX_FOOD + 1);
    state.foods.push(new Food(x, y));
  }

  function drawBackground(time) {
    const theme = TIME_THEMES[activeThemeName()];
    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, theme.top);
    gradient.addColorStop(0.5, theme.mid);
    gradient.addColorStop(1, theme.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    // 光のカーテンを薄く揺らし、観賞時に目立ち過ぎない動きにする。
    ctx.save();
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 7; i += 1) {
      const x = (i / 6) * state.width + Math.sin(time * 0.35 + i) * 24;
      const ray = ctx.createLinearGradient(x, 0, x + 80, state.height * 0.75);
      ray.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      ray.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.moveTo(x - 28, 0);
      ctx.lineTo(x + 50, 0);
      ctx.lineTo(x + 130, state.height * 0.78);
      ctx.lineTo(x - 80, state.height * 0.78);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = theme.glow;
    ctx.beginPath();
    ctx.ellipse(state.width * 0.5, state.height * 0.08, state.width * 0.56, state.height * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(238, 255, 255, 0.52)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= state.width; x += 18) {
      const y = state.height * 0.095 + Math.sin(time * 1.1 + x * 0.035) * 3;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (activeThemeName() === 'night') drawMoonlight(time);
    drawSand(theme);
    ctx.fillStyle = theme.overlay;
    ctx.fillRect(0, 0, state.width, state.height);
  }

  function drawMoonlight(time) {
    const x = state.width * 0.74 + Math.sin(time * 0.18) * 8;
    const gradient = ctx.createRadialGradient(x, state.height * 0.08, 8, x, state.height * 0.08, state.width * 0.24);
    gradient.addColorStop(0, 'rgba(214, 232, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(214, 232, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height * 0.45);
  }

  function drawSand(theme) {
    const top = state.height * 0.84;
    ctx.fillStyle = theme.sand;
    ctx.beginPath();
    ctx.moveTo(0, top);
    for (let x = 0; x <= state.width; x += 24) {
      ctx.lineTo(x, top + Math.sin(x * 0.025) * 5 + Math.cos(x * 0.011) * 4);
    }
    ctx.lineTo(state.width, state.height);
    ctx.lineTo(0, state.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(90, 67, 38, 0.15)';
    for (let i = 0; i < 80; i += 1) {
      const x = (i * 73) % state.width;
      const y = top + ((i * 31) % Math.max(1, state.height - top));
      ctx.fillRect(x, y, 2, 1);
    }
  }

  function drawDecorations(time) {
    for (const wood of state.driftwoods) {
      ctx.save();
      ctx.translate(wood.x, wood.y);
      ctx.rotate(wood.angle);
      ctx.strokeStyle = '#5c3420';
      ctx.lineWidth = 13;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-wood.w * 0.5, 0);
      ctx.quadraticCurveTo(0, -20, wood.w * 0.5, 6);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 231, 188, 0.18)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-wood.w * 0.45, -3);
      ctx.quadraticCurveTo(0, -18, wood.w * 0.42, 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const rock of state.rocks) {
      ctx.fillStyle = '#52626c';
      ctx.beginPath();
      ctx.ellipse(rock.x, rock.y, rock.r * 1.25, rock.r * 0.72, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.ellipse(rock.x - rock.r * 0.22, rock.y - rock.r * 0.18, rock.r * 0.35, rock.r * 0.16, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const plant of state.plants) {
      const rootY = state.height * 0.86;
      for (let leaf = 0; leaf < 5; leaf += 1) {
        const offset = (leaf - 2) * plant.width;
        const sway = Math.sin(time * 1.2 + plant.phase + leaf) * 13;
        ctx.strokeStyle = leaf % 2 ? '#43b36b' : '#2e9361';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(plant.x + offset * 0.25, rootY);
        ctx.quadraticCurveTo(plant.x + offset + sway * 0.35, rootY - plant.height * 0.48, plant.x + offset * 0.3 + sway, rootY - plant.height);
        ctx.stroke();
      }
    }
  }

  function update(dt, time) {
    syncEntities();
    state.bubbles.forEach((bubble) => bubble.update(dt, time, state.width, state.height));
    state.foods = state.foods.filter((food) => food.update(dt, time, state.height));
    state.fish.forEach((fish) => fish.update(dt, time, state.width, state.height, state.foods));

    state.foods = state.foods.filter((food) => {
      const eaten = state.fish.some((fish) => fish.touchesFood(food));
      return !eaten;
    });
  }

  function draw(time) {
    drawBackground(time);
    drawDecorations(time);
    state.foods.forEach((food) => food.draw(ctx));
    state.bubbles.forEach((bubble) => bubble.draw(ctx));
    state.fish.forEach((fish) => fish.draw(ctx, state.settings.showNames));
  }

  function animate(now) {
    const dt = Math.min(0.04, (now - state.lastTime) / 1000);
    const time = now / 1000;
    state.lastTime = now;
    update(dt, time);
    draw(time);
    requestAnimationFrame(animate);
  }

  function applySettingsToUi() {
    controls.fishCount.value = state.settings.fishCount;
    controls.bubbleCount.value = state.settings.bubbleCount;
    controls.showNames.checked = state.settings.showNames;
    controls.timeMode.value = state.settings.timeMode;
    controls.fishCountValue.textContent = state.settings.fishCount;
    controls.bubbleCountValue.textContent = state.settings.bubbleCount;
    panel.classList.toggle('hidden', state.settings.panelHidden);
    controls.showPanel.classList.toggle('visible', state.settings.panelHidden);
  }

  function bindEvents() {
    controls.fishCount.addEventListener('input', () => {
      state.settings.fishCount = Number(controls.fishCount.value);
      controls.fishCountValue.textContent = state.settings.fishCount;
      saveSettings();
    });
    controls.bubbleCount.addEventListener('input', () => {
      state.settings.bubbleCount = Number(controls.bubbleCount.value);
      controls.bubbleCountValue.textContent = state.settings.bubbleCount;
      saveSettings();
    });
    controls.showNames.addEventListener('change', () => {
      state.settings.showNames = controls.showNames.checked;
      saveSettings();
    });
    controls.timeMode.addEventListener('change', () => {
      state.settings.timeMode = controls.timeMode.value;
      saveSettings();
    });
    controls.feedMany.addEventListener('click', () => {
      for (let i = 0; i < 14; i += 1) addFood(random(state.width * 0.12, state.width * 0.88), random(state.height * 0.13, state.height * 0.3));
    });
    controls.fullscreen.addEventListener('click', async () => {
      if (!document.fullscreenElement) await app.requestFullscreen();
      else await document.exitFullscreen();
    });
    controls.hidePanel.addEventListener('click', () => {
      state.settings.panelHidden = true;
      saveSettings();
      applySettingsToUi();
    });
    controls.showPanel.addEventListener('click', () => {
      state.settings.panelHidden = false;
      saveSettings();
      applySettingsToUi();
    });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      addFood(event.clientX - rect.left, event.clientY - rect.top);
    });
    window.addEventListener('resize', resize);
  }


  resize();
  applySettingsToUi();
  bindEvents();
  syncEntities();
  preloadFishSprites().then(() => {
    state.lastTime = performance.now();
    requestAnimationFrame(animate);
  });
})();
