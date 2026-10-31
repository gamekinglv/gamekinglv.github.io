# 月读手记 · TSUKUYOMI NOTES

一个以《火影忍者》晓组织与宇智波鼬为视觉灵感的博客主界面。纯静态实现，无外部图片、字体和依赖。

## 预览

直接双击打开 `index.html` 即可。也可以在本目录启动任意静态服务器：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 页面内容

- 红月、晓袍忍者背影与乌鸦的手绘感 SVG 首屏
- 视差英雄区、滚动进度、导航高亮
- 写轮眼特写文章卡，瞳孔跟随鼠标
- 手记列表、卷宗、标签与月报订阅
- 可打开的文章阅读弹层（含「展开全部手记」）
- 移动端全屏导航、滚动入场动画、`prefers-reduced-motion` 支持

## 文件

```text
index.html          页面结构与所有内联插画
assets/styles.css   视觉样式与响应式布局
assets/main.js      导航、动效、订阅表单、阅读弹层
```

## 快速自定义

- 主色与字体：修改 `assets/styles.css` 顶部的 `:root` 变量。
- 文章内容与阅读弹层：修改 `assets/main.js` 中的 `articles` 对象。
- 首页文章卡：修改 `index.html` 中 `.featured-card` 与 `.post-card` 区块。
- 订阅表单为前端演示，不会真实发送邮件。

本页面是非官方同人视觉练习，与《火影忍者》原作版权方无关。
