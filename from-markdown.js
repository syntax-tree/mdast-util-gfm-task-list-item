exports.exit = {
  taskListCheckValueChecked: exitCheck,
  taskListCheckValueUnchecked: exitCheck,
  paragraph: exitParagraphWithTaskListItem
}

function exitCheck(token) {
  // We’re always in a paragraph, in a list item.
  this.stack[this.stack.length - 2].checked =
    token.type === 'taskListCheckValueChecked'
}

function exitParagraphWithTaskListItem(token) {
  var node = this.stack[this.stack.length - 1]
  var parent = this.stack[this.stack.length - 2]
  var head = node.children[0]

  if (
    parent.type === 'listItem' &&
    typeof parent.checked === 'boolean' &&
    head &&
    head.type === 'text'
  ) {
    // Must start with a space or a tab.
    head.value = head.value.slice(1)
  }

  this.exit(token)
}
