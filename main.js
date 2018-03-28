// Spec:: {
//  namespaces: {Prefix: URI},
//  filters: [{ (uri | literal | lang | datatype): [{path: Path, value: String}]}],
//  views: [{path: Path, name: String, funcs: [String]}],
//  sorts: [{path:Path, order: DESC | ASC}],
//  page: {number: PositiveInteger, size: PositiveInteger}
// }
// Path:: [{property: String, optional: Boolean, inverse: Boolean}]
//
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
SELECT ?item ${columns.join(' ')}
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

function page({number, size}) {
  const limit = size
  const offset = number * size - size
  return {limit, offset}
}

function prefixes(namespaces) {
  return Object.keys(namespaces)
    .map(prefix => `PREFIX ${prefix}: <${namespaces[prefix]}>`)
    .join('\n')
}

function view(views) {
  const columns = views.map(columnize)
  const clauses = views.map(x =>
    pathProperties(x.path, varizeWithFunctions(x.name, x.funcs), ''),
  )

  return {columns, clauses}
}

function columnize(x) {
  return x.funcs
    ? `(${x.funcs.reduceRight(
        (prev, curr) => `${curr}(${prev})`,
        varizeWithFunctions(x.name, x.funcs),
      )} AS ${varize(x.name)})`
    : varize(x.name)
}

function filterLiteral({path, value}) {
  return pathProperties(path, `"""${value}"""`, '')
}
function filterUris({path, value}) {
  return pathProperties(path, `${wrapUri(value)}`, '')
}

const wrapUri = uri => (uri.indexOf('/') > -1 ? `<${uri}>` : uri)

const varize = x => '?' + x.replace(':', '_')

const varizeWithFunctions = (x, funcs) => varize(x) + (funcs ? '__0' : '')

function pathProperties(path, finalVal, lastSparql) {
  lastSparql = lastSparql || ''
  const len = path.length
  if (len === 0) return lastSparql
  else {
    const rest = path.slice(0, -1)
    const curr = path[len - 1]
    const subject = len === 1 ? '?item' : varize(path[len - 2].property)
    const object = finalVal || varize(curr.property)
    const triple = curr.inverse
      ? `${object} ${curr.property} ${subject}`
      : `${subject} ${curr.property} ${object}`
    const sparql = `  ${triple} .\n${lastSparql}`
    return pathProperties(
      rest,
      false,
      curr.optional ? `OPTIONAL {\n  ${sparql}\n}` : sparql,
    )
  }
}
