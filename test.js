import test from 'tape'
import fromMarkdown from 'mdast-util-from-markdown'
import toMarkdown from 'mdast-util-to-markdown'
import {removePosition} from 'unist-util-remove-position'
import gfmTaskListItem from 'micromark-extension-gfm-task-list-item'
import {
  gfmTaskListItemFromMarkdown,
  gfmTaskListItemToMarkdown
} from './index.js'

test('markdown -> mdast', function (t) {
  t.deepEqual(
    fromMarkdown('* [x] a', {
      extensions: [gfmTaskListItem],
      mdastExtensions: [gfmTaskListItemFromMarkdown]
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
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
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
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
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
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
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
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
      }),
      true
    ).children[0],
    {type: 'paragraph', children: [{type: 'text', value: '[x] tasklist'}]},
    'should not support a task list item when not in a list item'
  )

  t.deepEqual(
    removePosition(
      fromMarkdown('* [x] *b*', {
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
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

  t.deepEqual(
    removePosition(
      fromMarkdown('* [x] a\n\n  b', {
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
      }),
      true
    ).children[0].children[0],
    {
      type: 'listItem',
      spread: true,
      checked: true,
      children: [
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'a'}]
        },
        {
          type: 'paragraph',
          children: [{type: 'text', value: 'b'}]
        }
      ]
    },
    'should support further paragraphs after checkboxes'
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
      {extensions: [gfmTaskListItemToMarkdown]}
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
      {extensions: [gfmTaskListItemToMarkdown]}
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
      {extensions: [gfmTaskListItemToMarkdown]}
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
      {extensions: [gfmTaskListItemToMarkdown]}
    ),
    '*   [d]: definition\n\n    e\n',
    'should ignore `checked` if the head is not a paragraph'
  )

  t.end()
})
