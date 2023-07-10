import assert from 'node:assert/strict'
import test from 'node:test'
import {gfmTaskListItem} from 'micromark-extension-gfm-task-list-item'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {toMarkdown} from 'mdast-util-to-markdown'
import {removePosition} from 'unist-util-remove-position'
import {
  gfmTaskListItemFromMarkdown,
  gfmTaskListItemToMarkdown
} from './index.js'

test('core', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('./index.js')).sort(), [
      'gfmTaskListItemFromMarkdown',
      'gfmTaskListItemToMarkdown'
    ])
  })
})

test('gfmTaskListItemFromMarkdown', async function (t) {
  await t.test('should support task list items', async function () {
    assert.deepEqual(
      fromMarkdown('* [x] a', {
        extensions: [gfmTaskListItem()],
        mdastExtensions: [gfmTaskListItemFromMarkdown()]
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
      }
    )
  })

  await t.test(
    'should support a task list item after a blank line',
    async function () {
      const tree = fromMarkdown('*\n  [x] after a blank line', {
        extensions: [gfmTaskListItem()],
        mdastExtensions: [gfmTaskListItemFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support a task list item follwed by a tab',
    async function () {
      const tree = fromMarkdown('* [x]\ttab', {
        extensions: [gfmTaskListItem()],
        mdastExtensions: [gfmTaskListItemFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support a task list item after a definition',
    async function () {
      const tree = fromMarkdown('* [x]: definition\n  [x] tasklist', {
        extensions: [gfmTaskListItem()],
        mdastExtensions: [gfmTaskListItemFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should not support a task list item when not in a list item',
    async function () {
      const tree = fromMarkdown('[x] tasklist', {
        extensions: [gfmTaskListItem()],
        mdastExtensions: [gfmTaskListItemFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
        type: 'root',
        children: [
          {type: 'paragraph', children: [{type: 'text', value: '[x] tasklist'}]}
        ]
      })
    }
  )

  await t.test(
    'should support a text construct after the checkbox',
    async function () {
      const tree = fromMarkdown('* [x] *b*', {
        extensions: [gfmTaskListItem()],
        mdastExtensions: [gfmTaskListItemFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )

  await t.test(
    'should support further paragraphs after checkboxes',
    async function () {
      const tree = fromMarkdown('* [x] a\n\n  b', {
        extensions: [gfmTaskListItem()],
        mdastExtensions: [gfmTaskListItemFromMarkdown()]
      })

      removePosition(tree, {force: true})

      assert.deepEqual(tree, {
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
      })
    }
  )
})

test('gfmTaskListItemToMarkdown', async function (t) {
  await t.test('should serialize a checked list item', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'listItem',
          checked: true,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'a'}]}
          ]
        },
        {extensions: [gfmTaskListItemToMarkdown()]}
      ),
      '* [x] a\n'
    )
  })

  await t.test('should serialize an unchecked list item', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'listItem',
          checked: false,
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'b'}]}
          ]
        },
        {extensions: [gfmTaskListItemToMarkdown()]}
      ),
      '* [ ] b\n'
    )
  })

  await t.test('should serialize an normal list item', async function () {
    assert.deepEqual(
      toMarkdown(
        {
          type: 'listItem',
          children: [
            {type: 'paragraph', children: [{type: 'text', value: 'c'}]}
          ]
        },
        {extensions: [gfmTaskListItemToMarkdown()]}
      ),
      '* c\n'
    )
  })

  await t.test(
    'should ignore `checked` if the head is not a paragraph',
    async function () {
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
          {extensions: [gfmTaskListItemToMarkdown()]}
        ),
        '* [d]: definition\n\n  e\n'
      )
    }
  )
})
