import * as fs from 'node:fs';

import solana from '@trezor/coins-solana/runtime';

const bigintReplacer = (_: string, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value;

const inputFile = process.argv[2];
if (!inputFile) {
    console.error('Usage: node decode-sol-staking-account.js <input.json>');
    process.exit(1);
}
if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    process.exit(1);
}
const raw = fs.readFileSync(inputFile, 'utf8');
const input = JSON.parse(raw);

const { decodeStakeResponses } = await solana();
const decoded = decodeStakeResponses(input);
const pretty = JSON.stringify(decoded, bigintReplacer, 2);
console.log(pretty);
