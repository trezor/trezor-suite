import { getAddress } from 'viem';

import {
    ETHEREUM_TRANSFER_GAS_LIMIT,
    MAX_GAS_PRICE_WEI,
    composeEthereumSweep,
    getGasPriceWithMargin,
} from './composeEthereumSweep';
import type { EthereumAccount } from './ethereumAccount';
import { getEthereumAddressPath } from './ethereumChain';

const ACCOUNT: EthereumAccount = {
    chain: 'ethereum',
    slip44: 60,
    index: 0,
    path: getEthereumAddressPath(60, 0),
    address: getAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045'),
};

const DESTINATION = { address: getAddress('0x70997970c51812dc3a010c7d01b50e0d17dc79c8') };

const ONE_ETHER = '1000000000000000000';

const TWENTY_GWEI = '20000000000';

const compose = (overrides: Partial<Parameters<typeof composeEthereumSweep>[0]> = {}) =>
    composeEthereumSweep({
        account: ACCOUNT,
        balance: ONE_ETHER,
        nonce: '7',
        unconfirmedTransactions: 0,
        gasPriceEstimate: TWENTY_GWEI,
        destination: DESTINATION,
        ...overrides,
    });

describe('composeEthereumSweep', () => {
    it('spends the whole balance minus the fee at the estimate plus the margin', () => {
        // 20 gwei + 20 % = 24 gwei; 21000 gas at 24 gwei = 0.000504 ETH.
        expect(compose()).toEqual({
            success: true,
            payload: {
                account: ACCOUNT,
                chainId: 1,
                nonce: 7,
                balance: ONE_ETHER,
                gasPrice: '24000000000',
                gasLimit: '21000',
                fee: '504000000000000',
                amount: '999496000000000000',
                destination: DESTINATION,
            },
        });
    });

    it('uses the chain id of the account chain', () => {
        const classic = compose({ account: { ...ACCOUNT, chain: 'ethereum-classic', slip44: 61 } });

        expect(classic.success && classic.payload.chainId).toBe(61);
    });

    it.each([
        [1n, 2n],
        [5n, 6n],
        [7n, 9n],
        [10n, 12n],
    ])('rounds the gas price with margin up to a whole wei (%s -> %s)', (estimate, expected) => {
        expect(getGasPriceWithMargin(estimate)).toBe(expected);
    });

    it('refuses a gas price above the cap and accepts one exactly at it', () => {
        const justOver = compose({ gasPriceEstimate: '416666666667' });
        expect(justOver).toEqual({
            success: false,
            error: { type: 'gas-price-too-high', gasPrice: '500000000001' },
        });

        const atCap = compose({ gasPriceEstimate: '416666666666' });
        expect(atCap.success && atCap.payload.gasPrice).toBe(MAX_GAS_PRICE_WEI.toString());
    });

    it('reports a balance that does not cover the fee, including one equal to it', () => {
        const fee = ETHEREUM_TRANSFER_GAS_LIMIT * 24_000_000_000n;

        expect(compose({ balance: fee.toString() })).toEqual({
            success: false,
            error: { type: 'insufficient-for-fee', balance: fee.toString(), fee: fee.toString() },
        });
        expect(compose({ balance: (fee + 1n).toString() })).toMatchObject({
            success: true,
            payload: { amount: '1' },
        });
    });

    it('composes nothing while a transaction of the address is in flight', () => {
        expect(compose({ unconfirmedTransactions: 1 })).toEqual({
            success: false,
            error: { type: 'transaction-in-flight' },
        });
    });

    it('reports an empty balance as nothing to move', () => {
        expect(compose({ balance: '0' })).toEqual({
            success: false,
            error: { type: 'nothing-to-move' },
        });
    });

    it.each([
        ['balance', { balance: '1.5' }],
        ['balance', { balance: '-1' }],
        ['balance', { balance: '' }],
        ['nonce', { nonce: '' }],
        ['nonce', { nonce: 'abc' }],
        ['nonce', { nonce: '9007199254740992' }],
        ['gasPrice', { gasPriceEstimate: '0' }],
        ['gasPrice', { gasPriceEstimate: '-1' }],
        ['gasPrice', { gasPriceEstimate: '1e9' }],
    ])('refuses backend data with an unusable %s', (field, overrides) => {
        expect(compose(overrides)).toEqual({
            success: false,
            error: { type: 'invalid-backend-data', field },
        });
    });
});
