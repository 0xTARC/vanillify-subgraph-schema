const fs = require("fs");
const { print, parse } = require("graphql");

// Load the subgraph schema from file
const schemaString = fs.readFileSync("./schema.graphql", "utf-8");

// Remove @derivedFrom instances
const schemaStringNoDerivedFrom = schemaString.replace(
  /@derivedFrom\([^)]*\)/g,
  ""
);

// Parse all entities
const subgraphSchema = parse(schemaStringNoDerivedFrom);
const subgraphSchemaDefinitions = subgraphSchema.definitions;

const newSchemaAST = {
  kind: "Document",
  definitions: [
    // Support BigInt and BigDecimal types as well as @entity directive
    // Query field at the top
    {
      kind: "ScalarTypeDefinition",
      description: undefined,
      name: { kind: "Name", value: "BigInt" },
      directives: [],
    },
    {
      kind: "ScalarTypeDefinition",
      description: undefined,
      name: { kind: "Name", value: "BigDecimal" },
      directives: [],
    },
    {
      kind: "DirectiveDefinition",
      description: undefined,
      name: { kind: "Name", value: "entity" },
      arguments: [],
      repeatable: false,
      locations: [{ kind: "Name", value: "OBJECT" }],
    },

    // Query type
    {
      kind: "ObjectTypeDefinition",
      name: {
        kind: "Name",
        value: "Query",
      },
      fields: subgraphSchemaDefinitions.map((entity) => ({
        kind: "FieldDefinition",
        name: {
          kind: "Name",
          value:
            entity.name.value.charAt(0).toLowerCase() +
            entity.name.value.slice(1), // lowercases first letter of entity name
        },
        arguments: [
          {
            kind: "InputValueDefinition",
            name: {
              kind: "Name",
              value: "id",
            },
            type: {
              kind: "NonNullType",
              type: {
                kind: "NamedType",
                name: {
                  kind: "Name",
                  value: "ID",
                },
              },
            },
          },
        ],
        type: {
          kind: "NamedType",
          name: {
            kind: "Name",
            value: entity.name.value,
          },
        },
      })),
    },
    // Inherit the rest of the original subgraph schema defs (without derivedFrom)
    ...subgraphSchemaDefinitions,
  ],
};

// Save the vanillified schema to a file
const fn = "schema.vanilla.graphql";
fs.writeFileSync(fn, print(newSchemaAST));
console.log(`Vanilla schema saved to ${fn}!`);
