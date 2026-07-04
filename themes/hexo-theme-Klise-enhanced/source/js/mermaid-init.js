/**
 * Mermaid 图表客户端渲染脚本
 * 自动检测页面中的 .mermaid 元素，加载 Mermaid 库并渲染图表
 * 支持明暗主题适配和错误提示
 */
(function () {
  'use strict'

  // Mermaid CDN 地址，使用明确版本号避免缓存问题
  var MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.min.js'

  // 默认 Mermaid 配置
  var DEFAULT_CONFIG = {
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: '"Noto Sans CJK SC", "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }

  /**
   * 获取当前主题模式
   * @returns {string} 'default' 或 'dark'
   */
  function getMermaidTheme() {
    return document.body.getAttribute('data-theme') === 'dark' ? 'dark' : 'default'
  }

  /**
   * 转义 HTML 特殊字符，防止 XSS
   * @param {string} text - 原始文本
   * @returns {string} 转义后的文本
   */
  function escapeHtml(text) {
    var div = document.createElement('div')
    div.appendChild(document.createTextNode(text))
    return div.innerHTML
  }

  /**
   * 显示错误信息到 Mermaid 容器
   * @param {Element} el - Mermaid 容器元素
   * @param {string} message - 错误消息
   */
  function showError(el, message) {
    var isDark = document.body.getAttribute('data-theme') === 'dark'
    var bgColor = isDark ? 'rgba(231, 76, 60, 0.1)' : 'rgba(231, 76, 60, 0.05)'
    var textColor = isDark ? '#ff6b6b' : '#e74c3c'
    var msgColor = isDark ? '#ccc' : '#666'

    el.innerHTML =
      '<div style="padding:15px;border:1px solid ' + textColor + ';border-radius:6px;background:' + bgColor + '">' +
      '<p style="color:' + textColor + ';font-weight:bold;margin:0 0 6px 0;font-size:14px;">⚠ Mermaid 图表语法错误</p>' +
      '<p style="color:' + msgColor + ';margin:0;font-family:monospace;font-size:13px;white-space:pre-wrap">' +
      escapeHtml(message) + '</p></div>'
  }

  /**
   * 从 .mermaid 容器中提取纯文本内容。
   * 服务端将换行符替换为 ~!NL!~ 占位符以对抗 HTML 压缩器，
   * 客户端需将占位符还原为 \n 再传给 Mermaid 渲染器。
   *
   * 使用 textContent 而非 innerHTML 的好处：
   * - 浏览器已自动解码 HTML 实体（&gt; → > 等）
   * - 无需手动剥离 HTML 标签
   * - Mermaid 节点标签内的 <br/> 文本自然保留
   *
   * @param {Element} el - .mermaid 容器元素
   * @returns {string}
   */
  function getMermaidText(el) {
    return (el.textContent || '')
      .replace(/~!NL!~/g, '\n')
      .trim()
  }

  /**
   * 渲染所有 Mermaid 图表
   * @param {NodeList} elements - Mermaid 容器元素列表
   */
  function renderDiagrams(elements) {
    var theme = getMermaidTheme()

    mermaid.initialize(Object.assign({}, DEFAULT_CONFIG, { theme: theme }))

    Array.prototype.forEach.call(elements, function (el, index) {
      var content = getMermaidText(el)

      if (!content) {
        showError(el, 'Mermaid 图表内容为空')
        return
      }

      var id = 'mermaid-' + index

      try {
        // 先用 parse 验证语法。Mermaid v11.4.0 的内建错误 SVG 会
        // 让 render() 以正常 promise resolve 返回 "Syntax error in text"
        // 的 SVG，导致我们的 .catch 无法捕获。先 parse 可确保错误被正确拦截。
        mermaid.parse(content).then(function () {
          return mermaid.render(id, content).then(function (result) {
            el.innerHTML = result.svg
          })
        }).catch(function (err) {
          showError(el, err.message || String(err))
        })
      } catch (err) {
        showError(el, String(err))
      }
    })
  }

  /**
   * 收集并初始化页面中的 Mermaid 元素
   */
  function initMermaid() {
    // 收集所有 .mermaid 元素（来自标签插件和 filter 转换）
    var mermaidEls = document.querySelectorAll('.mermaid')

    if (mermaidEls.length === 0) return

    // 动态加载 Mermaid 库
    if (typeof mermaid === 'undefined') {
      var script = document.createElement('script')
      script.src = MERMAID_CDN
      script.onload = function () {
        renderDiagrams(mermaidEls)
      }
      script.onerror = function () {
        Array.prototype.forEach.call(mermaidEls, function (el) {
          showError(el, 'Mermaid 库加载失败，请检查网络连接')
        })
      }
      document.head.appendChild(script)
    } else {
      renderDiagrams(mermaidEls)
    }
  }

  // 在 DOM 加载完成后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMermaid)
  } else {
    initMermaid()
  }
})()