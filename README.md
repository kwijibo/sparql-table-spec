`sparql-table-spec` exports a function which translates a _specification_ object to a SPARQL SELECT query.
The _specification_ object is intended as an intermediary form, between (say) a request to a REST API, and the generated SPARQL string; it should represent a useful subset of SPARQL expressivity, maintaining a higher level of abstraction than SPARQL, and a more readily manipulatable structure than a SPARQL AST.

## Example usage:

```
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
    page: {number: 2, size: 50},
    sorts: [{ path: [{property: "foaf:knows", inverse: false }, {property: "foaf:name", optional: true}], order: "DESC"  }]
})
```

## Example output:

```
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
 

```

## Structure of the Specification Object

```
Spec:: {
  namespaces: {Prefix: URI},
  page: {number: PositiveInteger, size: PositiveInteger},
  filters: [{ (uri | literal | lang | datatype): [{path: Path, value: String}]}],
  views: [{path: Path, name: String}],
  sorts: [{path:Path, order: DESC | ASC}]
}
 
Path:: [{property: String, optional: Boolean, inverse: Boolean}]

```
