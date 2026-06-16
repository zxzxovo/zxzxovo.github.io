+++
date = '2026-01-26'
draft = false
title = '26年腊月初八'
image = "./navigation.jpg"
description = "给自己过生日前乱写了一堆东西"
categories = ["Daily", "MY_ME"]
tags = ["生日快乐", "Daily", "呓语"]
topped = false
+++

# 26年腊月初八

## Some texts

好的，必须先承认我错了。我向很多朋友说过“孤独固然可怕，但却是这个世界上很常见的事情”，以此作为对他们倾诉孤独的安慰与总结。但现在我认为这是一个折磨人到疯也无法摆脱的最糟糕的病。

所以于我而言，与人联系变得更重要。但这药的效果并不那么明显，甚至在好转后的一段时间会有明显的副作用。而且也不能常吃到这药。
我以前会试图避免一个屏幕里只有自己的消息，现在完全不同了。不过好在我不常用微信，这样在外面看手机时我的脸就不会是绿色的，如果是的话他们最可能会嘲笑我基金或者股票跌了。

回忆是很棒的，有时你在里面翻找东西就跟寻宝一样，你会挖出垃圾或者找到宝藏，甚至钱也有可能。我现在常在无聊中发呆回忆，然后我想到，或许只是没有自己想做的事，让我对孤独的感受更加敏感。回忆里有许多片段我与现在的状况类似，但我当时的情绪却不像现在这样激烈。
很可能是病因，环境和症状完全符合。如果是的话治疗方案也很明确了，就是找点事去做（你妈说的闲出病来了可能是对的，但她也许不理解你身上发生了什么）。
但问题是，我找不到想做的事了。这很奇怪，这个世界上每种生命都有自己要做的事，植物和动物哪怕细菌病毒，都有自己的事要做而且会一直做下去，除了我。

写到这我不想继续想了，头痛，今天是我生日，特殊的日子，我完全有理由任性一把。

其实很多都是为了掩盖我还没长大的事实。童年的我如何脆弱，如今也是一样。冬天里的热炕或者带电热毯的床，在大冷天裹在这样的被窝里面那是很幸福的事情，而我只要钻进去就不想出来了，任何时候都是。
但人是不能待在被窝里不出来的，无论它多温暖多幸福。

猫咪是很可爱的生物，家养的猫是安静的爱的接受者。我也想过养一只猫，我希望自己能像猫咪得到我的关爱一样得到别人的关爱。我成长的环境让我觉得表达情绪是羞耻的事情，所以我会喜欢在朋友面前当小猫。小猫得到关爱不是理所当然的事情嘛(ฅ´ω`ฅ)
但我并不是可爱的🐱。

我最近的情绪和思维好乱，脑子里全是零碎的感受和句子，我想表达出来但没力气把它们组装成有逻辑的话。哎不管了。好在今天是我的生日，我可以心安理得的为所欲为，这篇文章写不好也不重要了，我有了一个任性的借口。

呼，睡醒了还是要离开被窝的，小猫咪总是会长大的，但我希望自己能长成小老虎。不管怎么样，我不该再像以前那样渴望身边的人无限制的帮助了，我要自己担起自己的重量。我希望能找到我自己的世界，希望不再惧怕孤独，希望能接近那些遥远的梦想，希望能去看看世界的各处。
我希望自己能够真正的坚韧，像野草，麦子，或者是超级细菌一样杀不死。我希望找回缺失的生命力，未来少些悲伤的眼泪，多些幸福的眼泪，“如果只扎根一次，我要疯狂生长一辈子”。

我不在乎许这么多愿望是贪婪与否，因为它们都要我自己实现。那么，

少女，飞吧。

## 小蛋糕

<div id="cake-container" style="width:100%;max-width:400px;margin:40px auto;text-align:center;">
  <canvas id="cake-canvas" width="400" height="450" style="width:100%;height:auto;display:block;"></canvas>
  <p style="margin-top:20px;font-size:1.2em;color:#FF69B4;font-weight:bold;">🎂 生日快乐 🎂</p>
</div>

<script>
(function(){
  function initCake() {
    const canvas = document.getElementById('cake-canvas');
    if(!canvas) {
      setTimeout(initCake, 100);
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const w = canvas.width;
    const h = canvas.height;
    
    // 绘制蛋糕
    function drawCake() {
      // 清空画布，设置背景
      ctx.fillStyle = '#FFF9F0';
      ctx.fillRect(0, 0, w, h);
      
      // 蛋糕底座阴影
      ctx.fillStyle = 'rgba(139, 69, 19, 0.2)';
      ctx.beginPath();
      ctx.ellipse(200, 380, 120, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 第一层蛋糕（底层）
      ctx.fillStyle = '#FFE4C4';
      ctx.fillRect(90, 290, 220, 80);
      // 顶部
      ctx.fillStyle = '#FFD7A8';
      ctx.beginPath();
      ctx.ellipse(200, 290, 110, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      // 底部
      ctx.fillStyle = '#D4A574';
      ctx.beginPath();
      ctx.ellipse(200, 370, 110, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 第二层蛋糕
      ctx.fillStyle = '#FFF0DB';
      ctx.fillRect(120, 220, 160, 70);
      ctx.fillStyle = '#FFE4C4';
      ctx.beginPath();
      ctx.ellipse(200, 220, 80, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#D4A574';
      ctx.beginPath();
      ctx.ellipse(200, 290, 80, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 第三层蛋糕（顶层）
      ctx.fillStyle = '#FFF5EE';
      ctx.fillRect(150, 170, 100, 50);
      ctx.fillStyle = '#FFF0DB';
      ctx.beginPath();
      ctx.ellipse(200, 170, 50, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#D4A574';
      ctx.beginPath();
      ctx.ellipse(200, 220, 50, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // 装饰圆点 - 第一层
      const dots1 = [
        {x: 140, y: 330, color: '#FF69B4'},
        {x: 200, y: 325, color: '#FF1493'},
        {x: 260, y: 330, color: '#FF69B4'},
        {x: 170, y: 340, color: '#FF1493'},
        {x: 230, y: 340, color: '#FF69B4'}
      ];
      dots1.forEach(dot => {
        ctx.fillStyle = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // 装饰圆点 - 第二层
      const dots2 = [
        {x: 150, y: 255, color: '#87CEEB'},
        {x: 200, y: 250, color: '#4169E1'},
        {x: 250, y: 255, color: '#87CEEB'}
      ];
      dots2.forEach(dot => {
        ctx.fillStyle = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // 绘制蜡烛
    function drawCandle(x, y, height) {
      // 蜡烛主体
      ctx.fillStyle = '#FF6B6B';
      ctx.fillRect(x - 5, y, 10, height);
      ctx.strokeStyle = '#D63447';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 5, y, 10, height);
      
      // 蜡烛顶部
      ctx.fillStyle = '#FF8787';
      ctx.beginPath();
      ctx.ellipse(x, y, 5, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 火焰类
    class Flame {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.time = Math.random() * Math.PI * 2;
        this.speed = 0.05 + Math.random() * 0.03;
      }
      
      update() {
        this.time += this.speed;
      }
      
      draw() {
        const flicker = Math.sin(this.time) * 2 + Math.cos(this.time * 1.5) * 1.5;
        
        // 光晕
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 25);
        glow.addColorStop(0, 'rgba(255, 165, 0, 0.3)');
        glow.addColorStop(1, 'rgba(255, 165, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // 外层火焰（橙色）
        ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 8 + flicker * 0.3, 15 + flicker, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 中层火焰（金色）
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 3, 5 + flicker * 0.2, 10 + flicker * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 内层火焰（白色）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 5, 3 + flicker * 0.1, 6 + flicker * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 创建火焰
    const flames = [
      new Flame(165, 120),
      new Flame(235, 120),
      new Flame(200, 110)
    ];
    
    // 绘制蜡烛位置
    const candles = [
      {x: 165, y: 130, h: 40},
      {x: 235, y: 130, h: 40},
      {x: 200, y: 120, h: 50}
    ];
    
    // 动画循环
    function animate() {
      drawCake();
      
      // 绘制蜡烛
      candles.forEach(candle => {
        drawCandle(candle.x, candle.y, candle.h);
      });
      
      // 更新和绘制火焰
      flames.forEach(flame => {
        flame.update();
        flame.draw();
      });
      
      requestAnimationFrame(animate);
    }
    
    animate();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCake);
  } else {
    initCake();
  }
})();
</script>
