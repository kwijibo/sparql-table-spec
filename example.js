const sparqlTable = require('./main.js')

const output = sparqlTable({
    namespaces: {
        foaf: "http://xmlns.com/foaf/0.1/",
        ex: "http://example.info/vocab/"
    },
    filters: [ {
        literals: [
            { path: [{property: "foaf:name", optional: true}]
            , value: "Sheena" }
        ],
        uris: [
            { path: [{property: "rdf:type"}], value: "ex:PunkRocker"}
            , { path: [{property: "foaf:knows", inverse: true }], value: "ex:Johnny"}
        ]
    }],
    views: [
        { path: [{property: "foaf:knows", optional: true}, {property: "foaf:name"}], name: "name"}
    ],
    page: {number: 1, size: 50}
})

console.log(output)
