import { address } from '@solana/addresses';
import { parseBase64RpcAccount } from '@solana/kit';
import type {
    AccountInfoBase,
    AccountInfoWithBase64EncodedData,
    Lamports,
} from '@solana/rpc-types';
import { decodeStakeStateAccount } from '@solana-program/stake';
import * as fs from 'node:fs';

type StakeAccountInfo = {
    data: [string, 'base64'];
    executable: boolean;
    lamports: number;
    owner: string;
    rentEpoch: string;
    space: number;
};

type StakeAccountWithKey = {
    account: StakeAccountInfo;
    pubkey: string;
};

const bigintReplacer = (_: string, value: unknown) =>
    typeof value === 'bigint' ? value.toString() : value;

const toRpcAccount = (
    account: StakeAccountInfo,
): AccountInfoBase & { rentEpoch: bigint } & AccountInfoWithBase64EncodedData => ({
    data: account.data as AccountInfoWithBase64EncodedData['data'],
    executable: account.executable,
    lamports: BigInt(account.lamports) as Lamports,
    owner: address(account.owner),
    rentEpoch: BigInt(account.rentEpoch ?? 0),
    space: BigInt(account.space ?? 0),
});

const decodeStakeResponses = (accountWithKey: StakeAccountWithKey) => {
    const parsed = parseBase64RpcAccount(
        address(accountWithKey.pubkey),
        toRpcAccount(accountWithKey.account),
    );
    const decoded = decodeStakeStateAccount(parsed);

    return {
        account: accountWithKey.pubkey,
        decoded: decoded.data,
    };
};

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
const input: StakeAccountWithKey = JSON.parse(raw);

const decoded = decodeStakeResponses(input);
const pretty = JSON.stringify(decoded, bigintReplacer, 2);
console.log(pretty);
