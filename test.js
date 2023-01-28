import assert from 'node:assert/strict'
import test from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {removePosition} from 'unist-util-remove-position'
import {gfmTaskListItem} from 'micromark-extension-gfm-task-list-item'
import {
  gfmTaskListItemFromMarkdown,
  gfmTaskListItemToMarkdown
} from './index.js'
import * as mod from './index.js'

test('core', () => {
  assert.deepEqual(
    Object.keys(mod).sort(),
    ['gfmTaskListItemFromMarkdown', 'gfmTaskListItemToMarkdown'],
    'should expose the public api'
  )
})

test('gfmTaskListItemFromMarkdown', () => {
  assert.deepEqual(
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

  assert.deepEqual(
    removePosition(
      fromMarkdown('*\n  [x] after a blank line', {
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
      }),
      true
    ),
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
                  children: [{type: 'text', value: 'after a blank line'}]
                }
              ]
            }
          ]
        }
      ]
    },
    'should support a task list item after a blank line'
  )

  assert.deepEqual(
    removePosition(
      fromMarkdown('* [x]\ttab', {
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
      }),
      true
    ),
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
                {type: 'paragraph', children: [{type: 'text', value: 'tab'}]}
              ]
            }
          ]
        }
      ]
    },
    'should support a task list item follwed by a tab'
  )

  assert.deepEqual(
    removePosition(
      fromMarkdown('* [x]: definition\n  [x] tasklist', {
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
      }),
      true
    ),
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
                  type: 'definition',
                  identifier: 'x',
                  label: 'x',
                  title: null,
                  url: 'definition'
                },
                {
                  type: 'paragraph',
                  children: [{type: 'text', value: 'tasklist'}]
                }
              ]
            }
          ]
        }
      ]
    },
    'should support a task list item after a definition'
  )

  assert.deepEqual(
    removePosition(
      fromMarkdown('[x] tasklist', {
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
      }),
      true
    ),
    {
      type: 'root',
      children: [
        {type: 'paragraph', children: [{type: 'text', value: '[x] tasklist'}]}
      ]
    },
    'should not support a task list item when not in a list item'
  )

  assert.deepEqual(
    removePosition(
      fromMarkdown('* [x] *b*', {
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
      }),
      true
    ),
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
                    {type: 'emphasis', children: [{type: 'text', value: 'b'}]}
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    'should support a text construct after the checkbox'
  )

  assert.deepEqual(
    removePosition(
      fromMarkdown('* [x] a\n\n  b', {
        extensions: [gfmTaskListItem],
        mdastExtensions: [gfmTaskListItemFromMarkdown]
      }),
      true
    ),
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
              spread: true,
              checked: true,
              children: [
                {type: 'paragraph', children: [{type: 'text', value: 'a'}]},
                {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
              ]
            }
          ]
        }
      ]
    },
    'should support further paragraphs after checkboxes'
  )
})

test('gfmTaskListItemToMarkdown', () => {
  assert.deepEqual(
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

  assert.deepEqual(
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

  assert.deepEqual(
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

  assert.deepEqual(
    toMarkdown(
      {
        type: 'listItem',
        checked: true,
        children: [
          {
            type: 'definition',
            label: 'd',
            identifier: 'd',
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
})
