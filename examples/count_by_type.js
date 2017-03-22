const sparqlTable = require('../main.js')

const output = sparqlTable({
    namespaces: {
        foaf: "http://xmlns.com/foaf/0.1/",
        ex: "http://example.info/vocab/",
        rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    },
    filters: [],
    views: [
        { path: [{property: "rdf:type", optional: false, inverse: true}], name: "entity_count", funcs: ["COUNT", "DISTINCT"]}
    ],
    page: {},
    sorts: []
})

console.log(output)
