import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { type FormState } from '@suite-common/wallet-types';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { asNetworkSymbol } from '@trezor/network-module';

import { getTransactionReviewModalActionTranslation } from './transactionReview';

const TOKEN_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const SPENDER = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';

const usdc: TokenInfo = {
    standard: 'ERC20',
    contract: TOKEN_CONTRACT,
    symbol: 'USDC',
    decimals: 6,
};

const getFormState = (overrides: Partial<FormState> = {}): FormState => ({
    ...DEFAULT_VALUES,
    options: ['broadcast'],
    outputs: [{ ...DEFAULT_PAYMENT, address: TOKEN_CONTRACT }],
    selectedUtxos: [],
    ...overrides,
});

const getTranslation = ({
    precomposedForm,
    approvalToken,
    source,
    isBumpFeeRbfAction = false,
}: {
    precomposedForm: FormState;
    approvalToken: TokenInfo | undefined;
    source: 'heading' | 'button';
    isBumpFeeRbfAction?: boolean;
}) =>
    getTransactionReviewModalActionTranslation({
        symbol: asNetworkSymbol('eth'),
        stakeType: null,
        precomposedForm,
        approvalToken,
        isBumpFeeRbfAction,
        isCancelRbfAction: false,
        source,
    });

describe('getTransactionReviewModalActionTranslation', () => {
    it('describes an approval signed outside of any trading or earn form state', () => {
        const precomposedForm = getFormState({
            transactionData: buildApprovalTransactionData({ amount: '1000000', spender: SPENDER }),
        });

        expect(getTranslation({ precomposedForm, approvalToken: usdc, source: 'heading' })).toEqual(
            {
                id: 'TR_APPROVAL_APPROVE_TOKEN_SPENDING',
                values: { displaySymbol: 'USDC' },
            },
        );
        expect(getTranslation({ precomposedForm, approvalToken: usdc, source: 'button' })).toEqual({
            id: 'TR_APPROVE_DATA_TITLE',
        });
    });

    it('describes a revocation', () => {
        const precomposedForm = getFormState({
            transactionData: buildApprovalTransactionData({ amount: '0', spender: SPENDER }),
        });

        expect(getTranslation({ precomposedForm, approvalToken: usdc, source: 'heading' })).toEqual(
            {
                id: 'TR_APPROVAL_REVOKE_TOKEN_SPENDING',
                values: { displaySymbol: 'USDC' },
            },
        );
        expect(getTranslation({ precomposedForm, approvalToken: usdc, source: 'button' })).toEqual({
            id: 'TR_REVOKE_DATA_TITLE',
        });
    });

    it('falls back to the symbol-less title when the approved token is unknown', () => {
        const precomposedForm = getFormState({
            transactionData: buildApprovalTransactionData({ amount: '1000000', spender: SPENDER }),
        });

        expect(
            getTranslation({ precomposedForm, approvalToken: undefined, source: 'heading' }),
        ).toEqual({ id: 'TR_APPROVE_DATA_TITLE' });
    });

    it('keeps describing a fee bump of a pending approval as a replacement', () => {
        const precomposedForm = getFormState({
            transactionData: buildApprovalTransactionData({ amount: '1000000', spender: SPENDER }),
        });

        expect(
            getTranslation({
                precomposedForm,
                approvalToken: usdc,
                source: 'heading',
                isBumpFeeRbfAction: true,
            }),
        ).toEqual({ id: 'TR_REPLACE_TX' });
    });

    it('keeps describing an exchange transaction without approval calldata as a swap', () => {
        const precomposedForm = getFormState({
            trading: { activeSection: 'exchange', isSlip24Active: false },
        });

        expect(
            getTranslation({ precomposedForm, approvalToken: undefined, source: 'heading' }),
        ).toEqual({ id: 'TR_TRADING_SWAP' });
    });
});
