const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

class BirthdayCakeWidget extends HTMLElement {
  private frame = 0;
  private time = 0;

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display: block; margin: 2.5rem auto; max-width: 25rem; }
          figure { margin: 0; text-align: center; }
          canvas { display: block; width: 100%; height: auto; border-radius: .75rem; }
          figcaption { margin-top: .75rem; color: #db2777; font: 600 1rem/1.5 ui-sans-serif, system-ui, sans-serif; }
        </style>
        <figure aria-label="三层生日蛋糕与烛光动画">
          <canvas width="400" height="450"></canvas>
          <figcaption>🎂 生日快乐 🎂</figcaption>
        </figure>`;
    }

    this.stop();
    this.draw();
  }

  disconnectedCallback() {
    this.stop();
  }

  private stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private draw = () => {
    const canvas = this.shadowRoot?.querySelector("canvas");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const { width, height } = canvas;
    const ellipse = (
      x: number,
      y: number,
      rx: number,
      ry: number,
      color: string | CanvasGradient,
    ) => {
      context.fillStyle = color;
      context.beginPath();
      context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      context.fill();
    };

    context.fillStyle = "#fff9f0";
    context.fillRect(0, 0, width, height);
    ellipse(200, 380, 120, 18, "rgba(120, 53, 15, .18)");

    const layers = [
      { x: 90, y: 290, w: 220, h: 80, top: "#ffd7a8", body: "#ffe4c4", edge: "#d4a574" },
      { x: 120, y: 220, w: 160, h: 70, top: "#ffe4c4", body: "#fff0db", edge: "#d4a574" },
      { x: 150, y: 170, w: 100, h: 50, top: "#fff0db", body: "#fff5ee", edge: "#d4a574" },
    ];

    for (const layer of layers) {
      context.fillStyle = layer.body;
      context.fillRect(layer.x, layer.y, layer.w, layer.h);
      ellipse(200, layer.y, layer.w / 2, layer.w / 8, layer.top);
      ellipse(200, layer.y + layer.h, layer.w / 2, layer.w / 8, layer.edge);
    }

    const decorations = [
      [140, 330, "#ff69b4"], [200, 325, "#ff1493"], [260, 330, "#ff69b4"],
      [170, 340, "#ff1493"], [230, 340, "#ff69b4"], [150, 255, "#87ceeb"],
      [200, 250, "#4169e1"], [250, 255, "#87ceeb"],
    ] as const;

    for (const [x, y, color] of decorations) {
      ellipse(x, y, y > 300 ? 6 : 5, y > 300 ? 6 : 5, color);
    }

    const candles = [
      { x: 165, y: 130, h: 40 },
      { x: 235, y: 130, h: 40 },
      { x: 200, y: 120, h: 50 },
    ];

    this.time += 0.055;
    for (const candle of candles) {
      context.fillStyle = "#ff6b6b";
      context.fillRect(candle.x - 5, candle.y, 10, candle.h);
      context.strokeStyle = "#d63447";
      context.strokeRect(candle.x - 5, candle.y, 10, candle.h);

      const flameY = candle.y - 10;
      const flicker = reduceMotion() ? 0 : Math.sin(this.time + candle.x) * 1.8;
      const glow = context.createRadialGradient(candle.x, flameY, 0, candle.x, flameY, 24);
      glow.addColorStop(0, "rgba(255, 165, 0, .35)");
      glow.addColorStop(1, "rgba(255, 165, 0, 0)");
      ellipse(candle.x, flameY, 24, 24, glow);
      ellipse(candle.x, flameY, 8, 15 + flicker, "rgba(255, 165, 0, .85)");
      ellipse(candle.x, flameY - 3, 5, 9 + flicker * .5, "rgba(255, 235, 90, .95)");
    }

    if (!reduceMotion()) this.frame = requestAnimationFrame(this.draw);
  };
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
};

type Rocket = Particle & { exploded: boolean };

class FireworksWidget extends HTMLElement {
  private frame = 0;
  private rockets: Rocket[] = [];
  private particles: Particle[] = [];

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `
        <style>
          :host { display: block; margin: 2rem 0; }
          canvas { display: block; width: 100%; height: min(25rem, 50vh); border-radius: .75rem; background: linear-gradient(#001a33, #000); }
        </style>
        <canvas aria-label="新年烟花动画"></canvas>`;
    }

    this.stop();
    this.resize();
    window.addEventListener("resize", this.resize);
    this.runFrame();
  }

  disconnectedCallback() {
    this.stop();
    window.removeEventListener("resize", this.resize);
  }

  private stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.rockets = [];
    this.particles = [];
  }

  private resize = () => {
    const canvas = this.shadowRoot?.querySelector("canvas");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
    canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  private random(min: number, max: number) {
    return min + Math.random() * (max - min);
  }

  private explode(rocket: Rocket) {
    const count = Math.floor(this.random(30, 60));
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = this.random(1, 6);
      this.particles.push({
        x: rocket.x,
        y: rocket.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        size: this.random(1, 3),
        color: rocket.color,
      });
    }
  }

  private drawStaticFireworks(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) {
    const bursts = [
      { x: width * 0.24, y: height * 0.38, radius: 48, color: "#fb7185" },
      { x: width * 0.55, y: height * 0.24, radius: 62, color: "#facc15" },
      { x: width * 0.78, y: height * 0.52, radius: 42, color: "#60a5fa" },
    ];

    context.lineCap = "round";
    for (const burst of bursts) {
      context.strokeStyle = burst.color;
      context.lineWidth = 2;
      for (let index = 0; index < 16; index += 1) {
        const angle = (index / 16) * Math.PI * 2;
        context.beginPath();
        context.moveTo(
          burst.x + Math.cos(angle) * burst.radius * 0.25,
          burst.y + Math.sin(angle) * burst.radius * 0.25,
        );
        context.lineTo(
          burst.x + Math.cos(angle) * burst.radius,
          burst.y + Math.sin(angle) * burst.radius,
        );
        context.stroke();
      }
    }
  }

  private runFrame = () => {
    const canvas = this.shadowRoot?.querySelector("canvas");
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    context.fillStyle = "rgba(0, 0, 0, .12)";
    context.fillRect(0, 0, width, height);

    if (reduceMotion()) {
      this.drawStaticFireworks(context, width, height);
      return;
    }

    if (Math.random() < 0.045) {
      this.rockets.push({
        x: this.random(0, width),
        y: height,
        vx: this.random(-1, 1),
        vy: this.random(-11, -8),
        alpha: 1,
        size: 2,
        color: `hsl(${Math.floor(this.random(0, 360))} 90% 60%)`,
        exploded: false,
      });
    }

    for (let index = this.rockets.length - 1; index >= 0; index -= 1) {
      const rocket = this.rockets[index];
      rocket.vy += 0.15;
      rocket.x += rocket.vx;
      rocket.y += rocket.vy;
      context.fillStyle = rocket.color;
      context.beginPath();
      context.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2);
      context.fill();
      if (rocket.vy >= 0) {
        this.explode(rocket);
        this.rockets.splice(index, 1);
      }
    }

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.vy += 0.08;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 0.01;
      context.globalAlpha = Math.max(0, particle.alpha);
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
      if (particle.alpha <= 0) this.particles.splice(index, 1);
    }
    context.globalAlpha = 1;

    this.frame = requestAnimationFrame(this.runFrame);
  };
}

if (!customElements.get("birthday-cake-widget")) {
  customElements.define("birthday-cake-widget", BirthdayCakeWidget);
}

if (!customElements.get("fireworks-widget")) {
  customElements.define("fireworks-widget", FireworksWidget);
}

export {};
