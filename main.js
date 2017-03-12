module.exports = function sparqlTable (spec){
    const {clauses, columns} = view(spec.views)
    const {limit, offset} = page(spec.page)
    return `${prefixes(spec.namespaces)}
SELECT ?item ${columns.join(' ')}
WHERE {
 { 
     ${spec.filters.map(f => 
        [f.uris
         .map(filterUris)
         .join('\n') 
        ,
        f.literals
         .map(filterLiteral)
         .join('\n')
        ].join('\n\t')
     ).join('} UNION {')} 
 }
 ${clauses}
}
${limit >=1? `LIMIT ${limit}`: ''}
${offset >=0? `OFFSET ${offset}`: ''}
`
}

function page({number, size}) {
    const limit = size
    const offset = 0
    return {limit, offset}
}


function prefixes(namespaces){
    return Object.keys(namespaces)
        .map(prefix => `PREFIX ${prefix}: <${namespaces[prefix]}>`)
        .join('\n')
}

function view(views){
   const columns = views.map(x=>varize(x.name)) 
   const clauses = views
        .map(x => pathProperties(x.path, '?'+ x.name, '' ))
        
   return  {columns, clauses} 
}

function filterLiteral ({path, value}){
   return pathProperties(path, `"""${value}"""`, '') 
}
function filterUris ({path, value}){
   return pathProperties(path, `${value}`, '') 
}


const varize = x => '?' + x.replace(':','_')

function pathProperties (path, finalVal, lastSparql){
  lastSparql = lastSparql || ''
  const len = path.length
  if(len===0) return lastSparql
  else {
    const rest = path.slice(0, -1)
    const curr = path[len-1]
    const subject = len===1? '?item' : varize(path[len-2].property)
    const object = finalVal || varize(curr.property)
    const triple = curr.inverse? `${object} ${curr.property} ${subject}` : `${subject} ${curr.property} ${object}`
    const sparql = `${triple} .\n\t    ${lastSparql}`
    return pathProperties(rest, false, curr.optional? `OPTIONAL {\n\t    ${sparql}\n\t}` : sparql)
  }
}
