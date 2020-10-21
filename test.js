var test = require('tape')
var fromMarkdown = require('mdast-util-from-markdown')
var toMarkdown = require('mdast-util-to-markdown')
var removePosition = require('unist-util-remove-position')
var syntax = require('micromark-extension-gfm-task-list-item')
var taskListItem = require('.')

test('markdown -> mdast', function (t) {
  t.deepEqual(
    fromMarkdown('* [x] a', {
      extensions: [syntax],
      mdastExtensions: [taskListItem.fromMarkdown]
    }),
    {
      type: 'root',
      children: [
        {
          type: 'list',
          ordered: false,
          start: null,
          spread: false,
          children: [
            {
              type: 'listItem',
              spread: false,
              checked: true,
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'a',
                      position: {
                        start: {line: 1, column: 7, offset: 6},
                        end: {line: 1, column: 8, offset: 7}
                      }
                    }
                  ],
                  position: {
                    start: {line: 1, column: 7, offset: 6},
                    end: {line: 1, column: 8, offset: 7}
                  }
                }
              ],
              position: {
                start: {line: 1, column: 1, offset: 0},
                end: {line: 1, column: 8, offset: 7}
              }
            }
          ],
          position: {
            start: {line: 1, column: 1, offset: 0},
            end: {line: 1, column: 8, offset: 7}
          }
        }
      ],
      position: {
        start: {line: 1, column: 1, offset: 0},
        end: {line: 1, column: 8, offset: 7}
      }
    },
    'should support task list items'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('*\n  [x] after a blank line', {
        extensions: [syntax],
        mdastExtensions: [taskListItem.fromMarkdown]
      }),
      true
    ).children[0].children[0],
    {
      type: 'listItem',
      spread: false,
      checked: true,
      children: [
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'after a blank line'}]
        }
      ]
    },
    'should support a task list item after a blank line'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('* [x]\ttab', {
        extensions: [syntax],
        mdastExtensions: [taskListItem.fromMarkdown]
      }),
      true
    ).children[0].children[0],
    {
      type: 'listItem',
      spread: false,
      checked: true,
      children: [{type: 'paragraph', children: [{type: 'text', value: 'tab'}]}]
    },
    'should support a task list item follwed by a tab'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('* [x]: definition\n  [x] tasklist', {
        extensions: [syntax],
        mdastExtensions: [taskListItem.fromMarkdown]
      }),
      true
    ).children[0].children[0],
    {
      type: 'listItem',
      spread: false,
      checked: true,
      children: [
        {
          type: 'definition',
          identifier: 'x',
          label: 'x',
          title: null,
          url: 'definition'
        },
        {type: 'paragraph', children: [{type: 'text', value: 'tasklist'}]}
      ]
    },
    'should support a task list item after a definition'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('[x] tasklist', {
        extensions: [syntax],
        mdastExtensions: [taskListItem.fromMarkdown]
      }),
      true
    ).children[0],
    {type: 'paragraph', children: [{type: 'text', value: '[x] tasklist'}]},
    'should not support a task list item when not in a list item'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('* [x] *b*', {
        extensions: [syntax],
        mdastExtensions: [taskListItem.fromMarkdown]
      }),
      true
    ).children[0].children[0],
    {
      type: 'listItem',
      spread: false,
      checked: true,
      children: [
        {
          type: 'paragraph',
          children: [{type: 'emphasis', children: [{type: 'text', value: 'b'}]}]
        }
      ]
    },
    'should support a text construct after the checkbox'
  )

  t.end()
})

test('mdast -> markdown', function (t) {
  t.deepEqual(
    toMarkdown(
      {
        type: 'listItem',
        checked: true,
        children: [{type: 'paragraph', children: [{type: 'text', value: 'a'}]}]
      },
      {extensions: [taskListItem.toMarkdown]}
    ),
    '*   [x] a\n',
    'should serialize a checked list item'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'listItem',
        checked: false,
        children: [{type: 'paragraph', children: [{type: 'text', value: 'b'}]}]
      },
      {extensions: [taskListItem.toMarkdown]}
    ),
    '*   [ ] b\n',
    'should serialize an unchecked list item'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'listItem',
        children: [{type: 'paragraph', children: [{type: 'text', value: 'c'}]}]
      },
      {extensions: [taskListItem.toMarkdown]}
    ),
    '*   c\n',
    'should serialize an normal list item'
  )

  t.deepEqual(
    toMarkdown(
      {
        type: 'listItem',
        checked: true,
        children: [
          {
            type: 'definition',
            label: 'd',
            title: null,
            url: 'definition'
          },
          {type: 'paragraph', children: [{type: 'text', value: 'e'}]}
        ]
      },
      {extensions: [taskListItem.toMarkdown]}
    ),
    '*   [d]: definition\n\n    e\n',
    'should ignore `checked` if the head is not a paragraph'
  )

  t.end()
})
