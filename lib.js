// Spec:: {
//  namespaces: {Prefix: URI},
//  filters: [{ (uri | literal | lang | datatype): [{path: Path, value: String}]}],
//  views: [{path: Path, name: String, funcs: [String]}],
//  sorts: [{path:Path, order: DESC | ASC}],
//  page: {number: PositiveInteger, size: PositiveInteger}
// }
// Path:: [{property: String, optional: Boolean, inverse: Boolean}]

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
  return x.funcs && x.funcs.length
    ? `(${x.funcs.reduceRight(
        (prev, curr) => `${curr}(${prev})`,
        varizeWithFunctions(x.name, x.funcs),
      )} AS ${varize(x.name)})`
    : varize(x.name)
}

function filterLiteral({path, value}) {
  return pathProperties(path, `"""${escapeSparqlLiteral(value)}"""`, '')
}
function filterUris({path, value}) {
  return pathProperties(path, `${wrapUri(value)}`, '')
}

const wrapUri = uri => (uri.indexOf('/') > -1 ? `<${uri}>` : uri)

const varize = x => '?' + x.replace(':', '_')

const varizeWithFunctions = (x, funcs) => varize(x) + (funcs && funcs.length ? '__0' : '')

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

function escapeSparqlLiteral(val){
  return String(val) //cast as String in case value is a Number, Boolean etc
          .replace(/\\/g, "\\\\") //escape SPARQL escape char (also js escape char, so we have to 2x \ )
          .replace(/([^\\])?"$/g,'$1\\"'); //escape the final char if it's 
          //an unescaped " as JENA doesn't like this, tho seems it should be fine in Long Literals...
}

module.exports = {
    view, page, pathProperties, varize, filterUris, filterLiteral, prefixes
}
