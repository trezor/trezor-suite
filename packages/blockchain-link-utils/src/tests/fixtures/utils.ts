export const filterTargets = [
    {
        description: 'addresses as string',
        addresses: 'A',
        targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
        parsed: [{ addresses: ['A'] }],
    },
    {
        description: 'addresses as array of strings',
        addresses: ['A'],
        targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
        parsed: [{ addresses: ['A'] }],
    },
    {
        description: 'addresses as array of mixed objects',
        addresses: ['A', 1, undefined, 'C', { address: 'B', path: '', transfers: 0, decimal: 0 }],
        targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
        parsed: [{ addresses: ['A'] }, { addresses: ['B'] }],
    },
    {
        description: 'targets not found',
        addresses: 'A',
        targets: [{ addresses: ['B'] }, { addresses: ['C'] }],
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (number)',
        addresses: 1,
        targets: [{ addresses: ['A'] }],
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (null)',
        addresses: null,
        targets: [{ addresses: ['A'] }],
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (array of numbers)',
        addresses: [1],
        targets: [{ addresses: ['A'] }],
        parsed: [],
    },
    {
        description: 'addresses as unexpected object (array of unexpected objects)',
        addresses: [{ foo: 'bar' }],
        targets: [{ addresses: ['A'] }],
        parsed: [],
    },
    {
        description: 'targets as unexpected object (string)',
        addresses: 'A',
        targets: 'A',
        parsed: [],
    },
    {
        description: 'targets as unexpected object (null)',
        addresses: 'A',
        targets: null,
        parsed: [],
    },
    {
        description: 'targets as unexpected object (array of unexpected objects)',
        addresses: 'A',
        targets: ['A', null, 1, {}],
        parsed: [],
    },
];

export const unsortedTxs = [
    { txid: 'e', blockHeight: 30, details: { vin: [{ txid: 'f' }, { txid: 'g' }] } },
    { txid: 'h', blockHeight: 20, details: { vin: [{ txid: 'e' }] } },
    { txid: 'c', blockHeight: 50, details: { vin: [{ txid: 'a' }] } },
    { txid: 'g', blockHeight: 30, details: { vin: [{ txid: 'b' }] } },
    { txid: 'a', blockHeight: -1, details: { vin: [] } },
    { txid: 'j', blockHeight: 10, details: { vin: [{ txid: 'x' }] } },
    { txid: 'b', blockHeight: undefined, details: { vin: [{ txid: 'x' }] } },
    { txid: 'd', blockHeight: 40, details: { vin: [{ txid: 'c' }] } },
    { txid: 'i', blockHeight: 10, details: { vin: [{ txid: 'j' }] } },
    { txid: 'f', blockHeight: 30, details: { vin: [{ txid: 'c' }, { txid: 'g' }, { txid: 'x' }] } },
];

export const sortedTxs = [...'abcdefghij'].map(txid => ({ txid }));
