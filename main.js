// Spec:: {
//  namespaces: {Prefix: URI},
//  filters: [{ (uri | literal | lang | datatype): [{path: Path, value: String}]}],
//  views: [{path: Path, name: String, funcs: [String]}],
//  sorts: [{path:Path, order: DESC | ASC}],
//  page: {number: PositiveInteger, size: PositiveInteger}
// }
// Path:: [{property: String, optional: Boolean, inverse: Boolean}]
//
const {
  prefixes,
  view,
  page,
  path,
  varize,
  pathProperties,
  filterUris,
  filterLiteral,
} = require('./lib.js')

module.exports = function sparqlTable(spec) {
  const {clauses, columns} = view(spec.views)
  const {limit, offset} = page(spec.page)
  const sortClause = spec.sorts
    .map(({path}, i) => pathProperties(path, '?_sortValue' + i, ''))
    .join('\n')
  const orderBy = spec.sorts.length
    ? `ORDER BY ${spec.sorts
        .map(({order}, i) => `${order}(?_sortValue${i})`)
        .join('\t')}`
    : ''
  const groupBy = spec.views.some(x => x.funcs.length)
    ? 'GROUP BY ' +
      ['?item']
        .concat(
          spec.views
            .filter(x => !x.hasOwnProperty('funcs'))
            .map(x => varize(x.name)),
        )
        .join(' ')
    : ''

  return `${prefixes(spec.namespaces)}
SELECT 
    ?item 
    ${columns.join(' \n    ')}
WHERE {

${spec.filters
    .map(f =>
      [
        f.uris.map(filterUris).join('\n'),
        f.literals.map(filterLiteral).join('\n'),
      ].join('\n'),
    )
    .map(s => `{ ${s} }`)
    .join(' UNION ')} 
 
${clauses.join('\n')}
${sortClause} 
}
${groupBy}
${orderBy}
${limit >= 1 ? `LIMIT ${limit}` : ''}
${offset >= 0 ? `OFFSET ${offset}` : ''}
`
}
