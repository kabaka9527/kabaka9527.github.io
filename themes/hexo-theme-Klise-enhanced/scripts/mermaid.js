/**
 * Mermaid 标签插件
 * 支持 {% mermaid %}...{% endmermaid %} 标签语法
 */
'use strict'

const { escapeHTML } = require('hexo-util')

/**
 * 换行占位符，用于对抗 HTML 压缩器。
 * 服务端将 \n 替换为 ~!NL!~，客户端再还原为 \n。
 * 该字符序列不是合法 Mermaid 语法，不存在歧义，
 * 同时避免了 <br> 与 Mermaid 节点内 <br/> 标签冲突的问题。
 */
var NL_PLACEHOLDER = '~!NL!~'

/**
 * 注册 mermaid 标签插件
 * 将 {% mermaid %} 标签内容包装为 <div class="mermaid"> 结构。
 * 换行符使用占位符 ~!NL!~ 表示，避免被 HTML 压缩器合并。
 */
const mermaidTag = (args, content) => {
  var html = escapeHTML(content)
    .replace(/\r?\n/g, NL_PLACEHOLDER)
  return '<div class="mermaid">' + html + '</div>'
}

hexo.extend.tag.register('mermaid', mermaidTag, { ends: true })

/**
 * Mermaid 图表语法关键字列表
 * 用于检测代码块内容是否为 Mermaid 图表
 */
var MERMAID_KEYWORDS = [
  'graph ', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
  'erDiagram', 'gantt', 'pie ', 'flowchart ', 'journey',
  'mindmap', 'timeline', 'gitgraph', 'quadrantChart',
  'requirementDiagram', 'block', 'gitGraph', 'C4Context',
  'xyChart', 'xychart', 'sankey', 'info'
]

/**
 * 检查文本内容是否为 Mermaid 图表语法
 * @param {string} text - 提取的代码文本
 * @returns {boolean}
 */
function isMermaidContent(text) {
  if (!text) return false
  var firstLine = text.split('\n')[0].trim()
  return MERMAID_KEYWORDS.some(function (kw) {
    return firstLine.startsWith(kw)
  })
}

/**
 * 提取 highlight.js 代码块中的文本内容并解码 HTML 实体。
 * 还原后的文本包含 \n 换行符，用于 isMermaidContent 检测。
 *
 * @param {string} codeContent - <pre> 内部的 HTML
 * @returns {string}
 */
function extractCodeText(codeContent) {
  return codeContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim()
}

/**
 * 生成 Mermaid 容器 HTML。
 * 从 <pre> 内部的原始 HTML 中提取文本，
 * 并将换行符替换为 ~!NL!~ 占位符以对抗 HTML 压缩器。
 *
 * 注意：不解码 HTML 实体，保留 &lt; &gt; &amp; 等实体原样输出。
 * 浏览器 textContent 会自动解码实体，客户端无需手动解码。
 * 这避免了 <br/> 等被实体编码的 HTML 标签变为真实标签，
 * 从而确保 Mermaid 节点内 <br/> 语法被 textContent 正确提取。
 *
 * @param {string} codeContent - <pre> 内部的原始 HTML
 * @returns {string} 使用占位符表示换行的 HTML
 */
function buildMermaidHTML(codeContent) {
  // 1. 将 <br> 转为 \n，剥离其余 HTML 标签
  var text = codeContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
  // 2. 将 \n 替换为占位符（对抗 HTML 压缩器）
  //    不解码 HTML 实体，由浏览器 textContent 自动解码
  return text.replace(/\n/g, NL_PLACEHOLDER)
}

/**
 * after_post_render 过滤器
 * 处理 fenced ```mermaid 代码块：从渲染后的 HTML 中提取代码内容
 * 并转换为 <div class="mermaid"> 结构
 */
hexo.extend.filter.register('after_post_render', function (data) {
  // 检查渲染后内容是否可能包含 Mermaid 图表
  // 使用多个 Marker 避免漏检不含 "mermaid" 字符串的文章
  var content = data.content
  if (!(content.includes('mermaid') ||
        content.includes('graph ') ||
        content.includes('flowchart ') ||
        content.includes('highlight plaintext'))) return data

  // 匹配 highlight.js 渲染的 <figure class="highlight plaintext"> 格式
  data.content = data.content.replace(
    /<figure class="highlight plaintext">[\s\S]*?<td class="code"><pre>([\s\S]*?)<\/pre>[\s\S]*?<\/figure>/g,
    function (match, codeContent) {
      var text = extractCodeText(codeContent)
      if (!text || !isMermaidContent(text)) return match
      return '<div class="mermaid">' + buildMermaidHTML(codeContent) + '</div>'
    }
  )

  // 匹配 <pre><code class="language-mermaid"> 格式（无高亮器时的回退渲染）
  data.content = data.content.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    function (match, content) {
      // 解码用于检测，但输出时保持原始实体
      var text = content
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .trim()
      if (!text || !isMermaidContent(text)) return match
      // 保持原始实体编码，仅替换换行为占位符
      return '<div class="mermaid">' + content.trim().replace(/\n/g, NL_PLACEHOLDER) + '</div>'
    }
  )

  return data
})