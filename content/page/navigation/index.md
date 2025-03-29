+++
title = "Navigation"
comments = true
date = 2025-02-06
slug = "Navigation"
image = "stp.jpg"

[menu.main]
name = "Navigation"
weight = 15

[menu.main.params]
icon = "map"

[build]
list = 'always'
publishResources = true
render = 'always'
+++

<style>
      .menav-navp-card {
        display: inline-block;
        width: 300px;
        text-align: center;
        background:rgb(255, 255, 255);
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        padding: 16px;
        transition: transform 0.3s, box-shadow 0.3s, background 0.3s;
    }
    html[data-scheme="dark"] .menav-navp-card {
        background-color: #2a2a2a;
        box-shadow: 0 4px 10px rgba(255, 255, 255, 0.1);
    }

    .menav-navp-card img {
        width: 100%;
        border-radius: 8px;
    }
    .menav-navp-card h2 {
        font-size: 20px;
        margin: 12px 0 6px;
    }
    .menav-navp-card p {
        font-size: 14px;
        color: #666;
        transition: color 0.3s;
    }

</style>

<div style="margin: auto; text-align: center;">
导航到一些地方...
</div>

## 项目主页 &nbsp; -w-

<div class="menav-navp-card">
  <img src="seq-here.png" alt="项目图片">
  <h2 ><a href="https://github.com/bio-here/seq-here" target="_blank">Seq-Here</a></h2>
  <p>快速的生信序列文件处理工具</p>
</div>


## 有趣的小玩意 \~w\~

<div class="menav-navp-card">
  <img src="your-project-image.jpg" alt="项目图片">
  <h2>一片空白</h2>
  <p>TODOOOOooooo。。。。。.....</p>
</div>
<br/>

