import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { type BIP32Interface, address as addressUtils, bip32, payments } from '@trezor/utxo-lib';

import { type AccountType, getAccountPath } from '../src/bitcoin/accountType';
import { BITCOIN_NETWORK } from '../src/bitcoin/bitcoinNetwork';

const DEFAULT_SEED = '000102030405060708090a0b0c0d0e0f';

export type MockWalletAddressParams = {
    accountType: AccountType;
    accountIndex?: number;
    chain?: number;
    addressIndex?: number;
};

/** A deterministic HD wallet standing in for the seed inside the device. */
export const mockWallet = (seedHex = DEFAULT_SEED) => {
    const root = bip32.fromSeed(Buffer.from(seedHex, 'hex'), BITCOIN_NETWORK);

    // Key derivation dominates the run time of the tests, so every node is derived only once.
    const nodes = new Map<string, BIP32Interface>();

    const deriveNode = (path: readonly number[]): BIP32Interface => {
        const key = path.join('/');
        const cached = nodes.get(key);
        if (cached) return cached;

        const parentPath = path.slice(0, -1);
        const index = path.at(-1);
        const node = index === undefined ? root : deriveNode(parentPath).derive(index);
        nodes.set(key, node);

        return node;
    };

    const getAccountXpub = (accountType: AccountType, accountIndex = 0) =>
        deriveNode(getAccountPath(accountType, accountIndex)).neutered().toBase58();

    // Scripts are built here from the private derivation, independently of the public
    // derivation in the application code they are compared against.
    const getScript = ({
        accountType,
        accountIndex = 0,
        chain = 0,
        addressIndex = 0,
    }: MockWalletAddressParams): Buffer => {
        const pubkey = deriveNode([
            ...getAccountPath(accountType, accountIndex),
            chain,
            addressIndex,
        ]).publicKey;
        const scripts = {
            p2pkh: () => payments.p2pkh({ pubkey, network: BITCOIN_NETWORK }),
            p2sh: () =>
                payments.p2sh({
                    redeem: payments.p2wpkh({ pubkey, network: BITCOIN_NETWORK }),
                    network: BITCOIN_NETWORK,
                }),
            p2wpkh: () => payments.p2wpkh({ pubkey, network: BITCOIN_NETWORK }),
        };
        const { output } = scripts[accountType]();
        if (!output) throw new Error('mockWallet: script could not be built');

        return output;
    };

    return {
        /** The `PublicKey` message old firmware answers with: always the plain xpub prefix. */
        getPublicKey: (path: readonly number[]): PROTO.PublicKey => {
            const node = deriveNode(path);

            return {
                node: {
                    depth: node.depth,
                    fingerprint: node.parentFingerprint,
                    child_num: node.index,
                    chain_code: node.chainCode.toString('hex'),
                    public_key: node.publicKey.toString('hex'),
                },
                xpub: node.neutered().toBase58(),
            };
        },
        getAccountXpub,
        getScript,
        getAddress: (params: MockWalletAddressParams) =>
            addressUtils.fromOutputScript(getScript(params), BITCOIN_NETWORK),
        getAddressPath: ({
            accountType,
            accountIndex = 0,
            chain = 0,
            addressIndex = 0,
        }: MockWalletAddressParams) => {
            const [purpose, coin, account] = getAccountPath(accountType, accountIndex).map(
                part => `${part - 0x80000000}'`,
            );

            return `m/${purpose}/${coin}/${account}/${chain}/${addressIndex}`;
        },
    };
};

export type MockWallet = ReturnType<typeof mockWallet>;
