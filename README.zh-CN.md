<div align="center">

<h1 align="center"><img src="media/slideblocks-mark.svg" alt="SlideBlocks logo" width="40" height="40" align="absmiddle"> SlideBlocks Skill</h1>

**快速制作精美、AI 原生格式的 PPT**

别再让 Agent 制作.pptx了，使用 SlideBlocks skill，把你的材料和需求交给 Agent，让它制作 HTML 原生的 PPT 吧。

[快速开始](#开始使用) · [制作后的 PPT 如何用](#成品怎么用) · [English](README.md)

</div>

<a href="media/showcase.png">
  <picture>
    <source media="(prefers-reduced-motion: reduce)" srcset="media/showcase.png">
    <source type="image/webp" srcset="media/showcase.webp">
    <img src="media/showcase.png" alt="SlideBlocks 制作的 16 张真实内页：圆角、浮空阴影与轻微晃动。">
  </picture>
</a>

<p align="center">
  <a href="media/agent-harness.webp">Agent Harness · 4 页精选 ↗</a> &nbsp; / &nbsp;
  <a href="media/m87.webp">M87 · 7 页精选 ↗</a> &nbsp; / &nbsp;
  <a href="media/star-formation.webp">Star Formation · 5 页精选 ↗</a>
</p>

<p align="center">
  <a href="https://uniuni2000.github.io/slideblocks-skill/#/1"><strong>▶ 在线体验《图像之前：人马座 A*》交互演示（英文）</strong></a><br>
  浏览器直接打开 · 无需安装 · 只读展示
</p>

## 开始使用

给 Agent 安装 skill：

```bash
npx skills add UniUni2000/slideblocks-skill
```

比如，附上相关材料，然后告诉 Agent：

> 用 SlideBlocks，把这篇论文做成一份 15 分钟的英文研究报告。

<details>
<summary>需要什么环境？</summary>

支持 Skill 的 Agent 程序，Node.js 环境，Chromium 浏览器。强烈建议使用带生图工具的 Agent。

</details>

## 成品怎么用

**使用 Chrome 或 Edge 打开 `offline.html`，就可以开始放映了。**

| 演讲 | 改字 | 分享 | 继续完善 |
| --- | --- | --- | --- |
| 全屏、演讲者、页面总览、标注工具等。 | 双击普通文本，`⌘/Ctrl + S` 保存。 | 右键 → **Export offline HTML** 或 **Export PDF**。 | 任何需求都可以直接告诉 Agent ，让它继续修改源码。 |

**交付格式：** Slidev 源码 + 离线 HTML；支持导出静态 PDF。不会输出 `.pptx`。

[MIT 许可证](LICENSE) · 基于 [Slidev](https://sli.dev)
