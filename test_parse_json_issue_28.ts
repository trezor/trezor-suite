// `TxSimulation` does `JSON.stringify(data)`.
// If `data` has a `BigInt` (like `115792...n`), `JSON.stringify` throws `Do not know how to serialize a BigInt`!
// Wait! `JSON.parse` does NOT produce BigInts unless `json-bigint` is used or a reviver is used!
// Is there a custom reviver or something that produces BigInt?
// Let's search for `BigInt` usage in `JSON.parse` or `ethers.js` parser.
