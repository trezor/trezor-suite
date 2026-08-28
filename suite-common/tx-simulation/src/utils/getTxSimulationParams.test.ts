import { base58 } from '@scure/base';

import { type TxSimulationAction } from '@suite-common/wallet-types';

import { getTxSimulationParams } from './getTxSimulationParams';

const sourceOrigin = 'https://app.uniswap.org';
const fromAddress = '0x0000000000000000000000000000000000001234';

const createEvmAction = (chainId: number): TxSimulationAction => ({
    method: 'ethereumSignTransaction',
    fromAddress,
    sourceOrigin,
    payload: {
        path: "m/44'/60'/0'/0/0",
        transaction: {
            to: '0x000000000000000000000000000000000000abcd',
            value: '0x0',
            data: '0x',
            chainId,
            nonce: '0',
            gasLimit: '0x0',
            gasPrice: '0x0',
        },
    },
});

describe('getTxSimulationParams', () => {
    it('returns null without an action', () => {
        expect(getTxSimulationParams(null)).toBeNull();
    });

    it('resolves the Blockaid chain name from the EVM chainId', () => {
        expect(getTxSimulationParams(createEvmAction(999))?.params).toMatchObject({
            chain: 'hyperevm',
            account_address: fromAddress,
        });
    });

    it('returns null for an EVM chain Blockaid cannot scan', () => {
        expect(getTxSimulationParams(createEvmAction(61))).toBeNull();
    });

    it('re-encodes the Solana transaction from hex to base58', () => {
        const serializedTx = '0102ab';

        const input = getTxSimulationParams({
            method: 'solanaSignTransaction',
            symbol: 'sol',
            fromAddress: 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB32fGbSMQRdW',
            sourceOrigin,
            payload: { path: "m/44'/501'/0'/0'", serializedTx },
        });

        expect(input).toMatchObject({
            method: 'solanaSignTransaction',
            params: {
                chain: 'mainnet',
                encoding: 'base58',
                transactions: [base58.encode(Buffer.from(serializedTx, 'hex'))],
                account_address: 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB32fGbSMQRdW',
                metadata: { url: sourceOrigin, non_dapp: true },
            },
        });
    });

    // The API decodes `account_address` with the request's `encoding`, so a base64 transaction
    // encoding made it reject every base58 Solana address.
    it('keeps the Solana account address decodable under the declared encoding', () => {
        const solanaAddress = 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB32fGbSMQRdW';

        const input = getTxSimulationParams({
            method: 'solanaSignTransaction',
            symbol: 'sol',
            fromAddress: solanaAddress,
            sourceOrigin,
            payload: { path: "m/44'/501'/0'/0'", serializedTx: '0102ab' },
        });

        expect(input?.params).toMatchObject({ encoding: 'base58' });
        expect(
            base58.decode((input?.params as { account_address: string }).account_address),
        ).toHaveLength(32);
    });

    it('sends the Stellar XDR envelope with the network name', () => {
        const input = getTxSimulationParams({
            method: 'stellarSignTransaction',
            symbol: 'xlm',
            fromAddress: 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH',
            sourceOrigin,
            payload: { path: "m/44'/148'/0'", xdrBase64: 'AAAAAgAAAAA=', testnet: false },
        });

        expect(input).toMatchObject({
            method: 'stellarSignTransaction',
            params: {
                chain: 'pubnet',
                transaction: 'AAAAAgAAAAA=',
                account_address: 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH',
                metadata: { type: 'wallet', url: sourceOrigin, non_dapp: true },
            },
        });
    });

    it('targets the Stellar testnet for a testnet account', () => {
        const input = getTxSimulationParams({
            method: 'stellarSignTransaction',
            symbol: 'txlm',
            fromAddress: 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH',
            sourceOrigin,
            payload: { path: "m/44'/148'/0'", xdrBase64: 'AA==', testnet: true },
        });

        expect(input?.params).toMatchObject({ chain: 'testnet' });
    });

    it('cannot scan a Stellar payload given as structured operations', () => {
        expect(
            getTxSimulationParams({
                method: 'stellarSignTransaction',
                symbol: 'xlm',
                fromAddress: 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH',
                sourceOrigin,
                payload: {
                    path: "m/44'/148'/0'",
                    networkPassphrase: 'Public Global Stellar Network ; September 2015',
                    transaction: {} as never,
                },
            }),
        ).toBeNull();
    });

    it('targets the devnet cluster for a devnet account', () => {
        const input = getTxSimulationParams({
            method: 'solanaSignTransaction',
            symbol: 'dsol',
            fromAddress: 'GsbwXfJraMomNxBcjYLcG3mxkBUiyWXAB32fGbSMQRdW',
            sourceOrigin,
            payload: { path: "m/44'/501'/0'/0'", serializedTx: '00' },
        });

        expect(input?.params).toMatchObject({ chain: 'devnet' });
    });
});
