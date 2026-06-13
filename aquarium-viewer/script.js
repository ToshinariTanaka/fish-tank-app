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
  const FISH_TYPES = [
    { body: '#ffb45f', fin: '#ff784d', stripe: '#ffe1a8' },
    { body: '#8ee6ff', fin: '#4aa8ff', stripe: '#e5fbff' },
    { body: '#d6a4ff', fin: '#8957ff', stripe: '#fff0ff' },
    { body: '#ffd76e', fin: '#ff9f43', stripe: '#fff6ba' },
    { body: '#9ff0b8', fin: '#37b982', stripe: '#e8fff0' },
  ];
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
      const type = FISH_TYPES[index % FISH_TYPES.length];
      this.name = NAMES[index % NAMES.length];
      this.bodyColor = type.body;
      this.finColor = type.fin;
      this.stripeColor = type.stripe;
      this.size = random(0.68, 1.35);
      this.length = 58 * this.size;
      const initialSpeed = random(26, 64) * (Math.random() > 0.5 ? 1 : -1);
      this.cruiseSpeed = Math.abs(initialSpeed);
      this.direction = initialSpeed >= 0 ? 1 : -1;
      this.speed = this.direction * this.cruiseSpeed;
      this.x = random(70, Math.max(90, width - 70));
      this.baseY = random(height * 0.2, height * 0.72);
      this.y = this.baseY;
      this.phase = random(0, Math.PI * 2);
      this.bobAmount = random(5, 18);
      this.bobSpeed = random(0.8, 1.7);
      this.turn = this.direction;
      this.targetFood = null;
    }

    update(dt, time, width, height, foods) {
      this.baseY = clamp(this.baseY, height * 0.18, height * 0.74);
      this.targetFood = findNearestFood(this, foods);
      let desiredSpeed = this.direction * this.cruiseSpeed;
      let targetY = this.baseY + Math.sin(time * this.bobSpeed + this.phase) * this.bobAmount;

      if (this.targetFood) {
        const dx = this.targetFood.x - this.x;
        const dy = this.targetFood.y - this.y;
        const horizontalDeadZone = Math.max(2, this.length * 0.04);
        desiredSpeed = Math.abs(dx) <= horizontalDeadZone
          ? 0
          : clamp(dx * 0.9, -105 * this.size, 105 * this.size);
        if (Math.abs(desiredSpeed) > 0.5) this.direction = Math.sign(desiredSpeed);
        targetY = this.y + clamp(dy * 0.85, -70, 70) * dt;
      }

      // 端では低下した現在速度ではなく、巡航速度を基準に反転する。
      const margin = this.length * 0.65;
      if (this.x > width - margin) {
        this.direction = -1;
        desiredSpeed = -this.cruiseSpeed;
      }
      if (this.x < margin) {
        this.direction = 1;
        desiredSpeed = this.cruiseSpeed;
      }
      this.speed += (desiredSpeed - this.speed) * Math.min(1, dt * 2.4);
      const facingDirection = Math.abs(this.speed) > 0.5 ? Math.sign(this.speed) : this.direction;
      this.turn += (facingDirection - this.turn) * Math.min(1, dt * 4);
      this.x += this.speed * dt;
      this.y += (targetY - this.y) * Math.min(1, dt * 2.2);
      this.y = clamp(this.y, height * 0.13, height * 0.79);
    }

    draw(context, showName) {
      context.save();
      context.translate(this.x, this.y);
      context.scale(this.turn >= 0 ? 1 : -1, 1);
      const length = this.length;
      const bodyHeight = length * 0.38;

      context.fillStyle = this.finColor;
      context.beginPath();
      context.moveTo(-length * 0.42, 0);
      context.lineTo(-length * 0.72, -bodyHeight * 0.55);
      context.lineTo(-length * 0.68, bodyHeight * 0.55);
      context.closePath();
      context.fill();

      context.beginPath();
      context.moveTo(-length * 0.05, -bodyHeight * 0.45);
      context.lineTo(-length * 0.25, -bodyHeight * 0.9);
      context.lineTo(length * 0.08, -bodyHeight * 0.45);
      context.closePath();
      context.fill();

      context.fillStyle = this.bodyColor;
      context.beginPath();
      context.ellipse(0, 0, length * 0.46, bodyHeight * 0.55, 0, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = this.stripeColor;
      context.lineWidth = Math.max(1.5, length * 0.035);
      context.globalAlpha = 0.65;
      context.beginPath();
      context.moveTo(-length * 0.12, -bodyHeight * 0.42);
      context.quadraticCurveTo(-length * 0.04, 0, -length * 0.12, bodyHeight * 0.42);
      context.moveTo(length * 0.09, -bodyHeight * 0.36);
      context.quadraticCurveTo(length * 0.16, 0, length * 0.09, bodyHeight * 0.36);
      context.stroke();
      context.globalAlpha = 1;

      context.fillStyle = '#07131c';
      context.beginPath();
      context.arc(length * 0.29, -bodyHeight * 0.12, Math.max(2, length * 0.035), 0, Math.PI * 2);
      context.fill();
      context.restore();

      if (showName) {
        context.save();
        context.font = `${Math.max(12, 12 * this.size)}px sans-serif`;
        context.textAlign = 'center';
        context.fillStyle = 'rgba(1, 16, 25, 0.45)';
        context.fillText(this.name, this.x + 1, this.y - this.length * 0.36 + 1);
        context.fillStyle = 'rgba(240, 252, 255, 0.92)';
        context.fillText(this.name, this.x, this.y - this.length * 0.36);
        context.restore();
      }
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
    state.width = Math.max(320, rect.width);
    state.height = Math.max(360, rect.height);
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
      const eaten = state.fish.some((fish) => Math.hypot(food.x - fish.x, food.y - fish.y) < fish.length * 0.22 + food.radius);
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
  requestAnimationFrame(animate);
})();
