const test = require('tape')
const {view} = require('./lib.js')

test('view', function(t) {
  const views = [
    {name: 'friend', path: [{property: 'foaf:knows'}, {property: 'foaf:name'}]},
  ]
  const actual = view(views)
  const expected = {
    columns: ['?friend'],
    clauses: [
      '  ?item foaf:knows ?foaf_knows .\n  ?foaf_knows foaf:name ?friend .\n',
    ],
  }
  t.deepEqual(actual, expected, 'view should return {columns: [], clauses: []}')
  t.end()
})
