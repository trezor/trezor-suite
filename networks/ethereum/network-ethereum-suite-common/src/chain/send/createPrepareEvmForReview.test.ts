import type {
    ChainSendDraft,
    GeneralPrecomposedTransactionFinal,
} from '@trezor/network-module-suite-common-types';

import { createPrepareEvmForReview } from './createPrepareEvmForReview';

const isEvmTokenDefinitionKnown = jest.fn(() => Promise.resolve(true));
const prepare = createPrepareEvmForReview({ isEvmTokenDefinitionKnown })({ chainId: 1 });

const token = { contract: '0xtoken', decimals: 6, standard: 'ERC20' };
const precomposed = {
    type: 'final',
    fee: '21000',
    totalSpent: '21000',
    outputs: [],
    token,
} as unknown as GeneralPrecomposedTransactionFinal;

const review = (transactionData?: string) =>
    prepare({ account: {} as never, draft: { transactionData } as ChainSendDraft, precomposed });

describe('createPrepareEvmForReview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('says whether the device knows the sent token', async () => {
        const { precomposed: prepared, isTokenKnown } = await review();

        expect(prepared).toMatchObject({ token });
        expect(isTokenKnown).toBe(true);
        expect(isEvmTokenDefinitionKnown).toHaveBeenCalledWith({ chainId: 1, contract: '0xtoken' });
    });

    it('keeps the token of an approval, which is a token call itself', async () => {
        // approve(spender, 1)
        const data = `0x095ea7b3${'0'.repeat(24)}${'1'.repeat(40)}${'0'.repeat(63)}1`;

        await expect(review(data)).resolves.toMatchObject({ precomposed: { token } });
    });

    it('drops the token of a contract call, so signing keeps the calldata', async () => {
        const { precomposed: prepared, isTokenKnown } = await review('0xdeadbeef');

        expect(prepared).not.toHaveProperty('token');
        expect(isTokenKnown).toBeUndefined();
    });
});
