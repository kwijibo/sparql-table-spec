const sparqlTable = require('../main.js')

const output = sparqlTable({
    namespaces: {
        foaf: "http://xmlns.com/foaf/0.1/",
        ex: "http://example.info/vocab/",
        rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
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
        { path: [{property: "foaf:knows", optional: true}, {property: "foaf:name"}], name: "name", funcs: ["COUNT", "DISTINCT"]}
    ],
    page: {number: 2, size: 50},
    sorts: [{ path: [{property: "foaf:knows", inverse: false }, {property: "foaf:name", optional: true}], order: "DESC"  }]
})

console.log(output)
/*

PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX ex: <http://example.info/vocab/>
SELECT ?item ?name
WHERE {
 { 
     ?item rdf:type ex:PunkRocker .
	    
ex:Johnny foaf:knows ?item .
	    
	OPTIONAL {
	    ?item foaf:name """Sheena""" .
	    
	} 
 }
 OPTIONAL {
	    ?item foaf:knows ?foaf_knows .
	    ?foaf_knows foaf:name ?name .
	    
	}
 ?item foaf:knows ?foaf_knows .
	    OPTIONAL {
	    ?foaf_knows foaf:name ?_sortValue0 .
	    
	} 
}
ORDER BY DESC(?_sortValue0)
LIMIT 50
OFFSET 49
 
*/
