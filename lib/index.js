/**
 * @typedef {import('mdast').ListItem} ListItem
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('mdast').Parents} Parents
 * @typedef {import('mdast-util-from-markdown').CompileContext} CompileContext
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').Info} ToMarkdownInfo
 * @typedef {import('mdast-util-to-markdown').State} ToMarkdownState
 */

import {ok as assert} from 'devlop'
import {defaultHandlers} from 'mdast-util-to-markdown'

/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM task
 * list items in markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown` to enable GFM task list items.
 */
export function gfmTaskListItemFromMarkdown() {
  return {
    exit: {
      taskListCheckValueChecked: exitCheck,
      taskListCheckValueUnchecked: exitCheck,
      paragraph: exitParagraphWithTaskListItem
    }
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM task list
 * items in markdown.
 *
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM task list items.
 */
export function gfmTaskListItemToMarkdown() {
  return {
    unsafe: [{atBreak: true, character: '-', after: '[:|-]'}],
    handlers: {listItem: listItemWithTaskListItem}
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitCheck(token) {
  // We’re always in a paragraph, in a list item.
  const node = this.stack[this.stack.length - 2]
  assert(node.type === 'listItem')
  node.checked = token.type === 'taskListCheckValueChecked'
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitParagraphWithTaskListItem(token) {
  const parent = this.stack[this.stack.length - 2]

  if (
    parent &&
    parent.type === 'listItem' &&
    typeof parent.checked === 'boolean'
  ) {
    const node = this.stack[this.stack.length - 1]
    assert(node.type === 'paragraph')
    const head = node.children[0]

    if (head && head.type === 'text') {
      const siblings = parent.children
      let index = -1
      /** @type {Paragraph | undefined} */
      let firstParaghraph

      while (++index < siblings.length) {
        const sibling = siblings[index]
        if (sibling.type === 'paragraph') {
          firstParaghraph = sibling
          break
        }
      }

      if (firstParaghraph === node) {
        // Must start with a space or a tab.
        head.value = head.value.slice(1)

        if (head.value.length === 0) {
          node.children.shift()
        } else if (
          node.position &&
          head.position &&
          typeof head.position.start.offset === 'number'
        ) {
          head.position.start.column++
          head.position.start.offset++
          node.position.start = Object.assign({}, head.position.start)
        }
      }
    }
  }

  this.exit(token)
}

/**
 * @type {ToMarkdownHandle}
 * @param {ListItem} node
 */
function listItemWithTaskListItem(node, parent, state, info) {
  const siblings = node.children
  let index = -1
  /** @type {Paragraph | undefined} */
  let firstParagraph

  while (++index < siblings.length) {
    const sibling = siblings[index]
    if (sibling.type === 'paragraph') {
      firstParagraph = sibling
      break
    }
  }

  const checkable = typeof node.checked === 'boolean' && firstParagraph
  const atHead = firstParagraph === siblings[0]
  const checkbox = '[' + (node.checked ? 'x' : ' ') + '] '
  const tracker = state.createTracker(info)
  const paragraphHandle = state.handlers.paragraph

  if (checkable && atHead) {
    tracker.move(checkbox)
  }

  // Prefix the first paragraph when it is not the first child (e.g. a
  // definition), so `[x]` / `[ ]` is not escaped and still round-trips.
  if (checkable && !atHead) {
    /**
     * @param {Paragraph} paragraphNode
     * @param {Parents | undefined} parentNode
     * @param {ToMarkdownState} nestedState
     * @param {ToMarkdownInfo} nestedInfo
     * @returns {string}
     */
    state.handlers.paragraph = function (
      paragraphNode,
      parentNode,
      nestedState,
      nestedInfo
    ) {
      if (paragraphNode !== firstParagraph) {
        return paragraphHandle(
          paragraphNode,
          parentNode,
          nestedState,
          nestedInfo
        )
      }

      const nestedTracker = nestedState.createTracker(nestedInfo)
      nestedTracker.move(checkbox)
      return (
        checkbox +
        paragraphHandle(paragraphNode, parentNode, nestedState, {
          ...nestedInfo,
          ...nestedTracker.current()
        })
      )
    }
  }

  /** @type {string} */
  let value

  try {
    value = defaultHandlers.listItem(node, parent, state, {
      ...info,
      ...tracker.current()
    })
  } finally {
    state.handlers.paragraph = paragraphHandle
  }

  if (checkable && atHead) {
    value = value.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/, check)
  }

  return value

  /**
   * @param {string} $0
   * @returns {string}
   */
  function check($0) {
    return $0 + checkbox
  }
}
