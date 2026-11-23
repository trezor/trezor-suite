import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FormState, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockAccountToken } from '@suite-common/wallet-types/mocks';

import { getSentTransactionAsset } from './getSentTransactionAsset';

const symbol = asNetworkSymbol('eth');

const precomposedTransaction: PrecomposedTransactionFinal = {
    type: 'final',
    inputs: [],
    outputs: [],
    fee: '500000000000000000',
    totalSpent: '1500000000000000000',
    feePerByte: '1',
    bytes: 1,
    outputsPermutation: [],
};

const getForm = (nftTokenId: string | undefined) =>
    ({ outputs: [{ type: 'payment', amount: '1', nftTokenId }] }) as unknown as FormState;

describe('getSentTransactionAsset', () => {
    it('names the NFT item instead of an amount', () => {
        const nft = mockAccountToken({ standard: 'ERC721', contract: '0xnft', decimals: 0 });

        expect(
            getSentTransactionAsset({
                precomposedTransaction: { ...precomposedTransaction, token: nft, totalSpent: '1' },
                precomposedForm: getForm('7'),
                symbol,
            }),
        ).toEqual({ token: nft, nftTokenId: '7' });
    });

    it('sends the token amount in main units', () => {
        const usdt = mockAccountToken({ contract: '0xusdt', decimals: 6 });

        expect(
            getSentTransactionAsset({
                precomposedTransaction: {
                    ...precomposedTransaction,
                    token: usdt,
                    totalSpent: '2500000',
                },
                precomposedForm: getForm(undefined),
                symbol,
            }),
        ).toEqual({ token: usdt, amount: '2.5' });
    });

    it('sends the native amount without the fee', () => {
        expect(
            getSentTransactionAsset({
                precomposedTransaction,
                precomposedForm: getForm(undefined),
                symbol,
            }),
        ).toEqual({ amount: '1' });
    });
});
