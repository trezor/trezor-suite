import type { ChainSendDraft } from './ChainSend';
import { getComposeFailureNotice } from './ChainSendError';
import type { GeneralPrecomposedTransactionFinal } from './PrecomposedTransaction';
import { createPrepareReplacementForReview, tagReplacement } from './prepareReplacementForReview';

const precomposed = {
    type: 'final',
    fee: '300',
    totalSpent: '1300',
    outputs: [],
} as unknown as GeneralPrecomposedTransactionFinal;

const replacing = (type: 'bitcoin' | 'ethereum') =>
    ({ rbfParams: { type, txid: 'orig', baseFee: 100 } }) as unknown as ChainSendDraft;

describe('tagReplacement', () => {
    it('leaves a transaction that replaces nothing as it is', () => {
        expect(tagReplacement({} as ChainSendDraft, precomposed, { useNativeRbf: true })).toBe(
            precomposed,
        );
    });

    it('tags a fee bump with what it replaces and what it costs on top', () => {
        expect(tagReplacement(replacing('bitcoin'), precomposed, { useNativeRbf: true })).toEqual({
            ...precomposed,
            rbfType: 'bump-fee',
            prevTxid: 'orig',
            feeDifference: '200',
            useNativeRbf: true,
        });
    });

    it('counts the whole fee as extra where the original fee is not known', () => {
        expect(
            tagReplacement(replacing('ethereum'), precomposed, { useNativeRbf: false }),
        ).toMatchObject({ feeDifference: '300', useNativeRbf: false });
    });

    it('keeps a cancel tagged as a cancel', () => {
        const cancel = { ...precomposed, rbfType: 'cancel' } as GeneralPrecomposedTransactionFinal;

        expect(tagReplacement(replacing('ethereum'), cancel, { useNativeRbf: false })).toEqual({
            ...cancel,
            prevTxid: 'orig',
        });
    });

    it('never tags a transaction built from an unsigned body', () => {
        const cardano = { ...precomposed, unsignedTx: {} } as GeneralPrecomposedTransactionFinal;

        expect(tagReplacement(replacing('bitcoin'), cardano, { useNativeRbf: true })).toBe(cardano);
    });

    it('prepares a review with no token knowledge', async () => {
        const prepare = createPrepareReplacementForReview({ useNativeRbf: false });

        await expect(
            prepare({ account: {} as never, draft: {} as ChainSendDraft, precomposed }),
        ).resolves.toEqual({ precomposed });
    });
});

describe('getComposeFailureNotice', () => {
    it('shows Connect failures but not invalid input the form already flags', () => {
        expect(getComposeFailureNotice('Backend_Error')).toBe('message');
        expect(getComposeFailureNotice('Method_InvalidParameter')).toBeUndefined();
        expect(getComposeFailureNotice(undefined)).toBeUndefined();
    });
});
