import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';

import {
    checkRuntimeAmount,
    checkRuntimeRecipient,
    createRuntimeChainSendDraft,
    toRuntimeChainSendAccount,
    withSignedAmount,
} from './runtimeChainSend';

const CHECKSUMMED = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';

describe('runtimeChainSend', () => {
    it("sends from the wallet account's address and path, with the runtime network's balance", () => {
        expect(
            toRuntimeChainSendAccount(
                {
                    descriptor: asAccountDescriptor('0xabc'),
                    index: 2,
                    path: "m/44'/60'/0'/0/2",
                    accountType: 'normal',
                    deviceState: 'state@device:1',
                },
                { symbol: asNetworkSymbol('abc'), decimals: 18 },
                '1.5',
            ),
        ).toEqual({
            symbol: 'abc',
            descriptor: '0xabc',
            index: 2,
            path: "m/44'/60'/0'/0/2",
            accountType: 'normal',
            deviceState: 'state@device:1',
            balance: '1500000000000000000',
            availableBalance: '1500000000000000000',
            formattedBalance: '1.5',
        });
    });

    it('drafts a native coin send, and signs the composed max', () => {
        const draft = createRuntimeChainSendDraft({
            address: CHECKSUMMED,
            amount: '1',
            isMax: true,
            selectedFee: 'high',
        });

        expect(draft).toMatchObject({
            outputs: [{ type: 'payment', address: CHECKSUMMED, amount: '', token: null }],
            setMaxOutputId: 0,
            selectedFee: 'high',
            transactionData: '',
            ethereumNonce: '',
        });
        expect(withSignedAmount(draft, '0.99').outputs[0]?.amount).toBe('0.99');
    });

    it.each([
        [CHECKSUMMED.toLowerCase(), { address: CHECKSUMMED }],
        [`0x${CHECKSUMMED.slice(2).toUpperCase()}`, { address: CHECKSUMMED }],
        [` ${CHECKSUMMED} `, { address: CHECKSUMMED }],
        [CHECKSUMMED.replace('a', 'A'), { error: expect.stringContaining('checksum') }],
        ['0x123', { error: expect.stringContaining('EVM address') }],
    ])('checks the recipient %s', (input, expected) => {
        expect(checkRuntimeRecipient(input)).toEqual(expected);
    });

    it.each([
        ['', 'Enter an amount.'],
        ['0', 'Enter an amount above zero.'],
        ['0.1234567890123456789', 'Enter a number with at most 18 decimals.'],
        ['1.5', undefined],
    ])('checks the amount %j', (amount, expected) => {
        expect(checkRuntimeAmount(amount, 18)).toBe(expected);
    });
});
