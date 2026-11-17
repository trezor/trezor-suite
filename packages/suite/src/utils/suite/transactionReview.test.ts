import { type TokenAddress, toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { type FormState } from '@suite-common/wallet-types';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';

import { getTransactionReviewModalAction } from './transactionReview';

const ETH = asNetworkSymbol('eth');
const TOKEN_CONTRACT = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const SPENDER = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';

const getFormState = (overrides: Partial<FormState> = {}): FormState => ({
    ...DEFAULT_VALUES,
    options: ['broadcast'],
    outputs: [{ ...DEFAULT_PAYMENT, address: TOKEN_CONTRACT }],
    selectedUtxos: [],
    ...overrides,
});

type GetTranslationParams = {
    precomposedForm: FormState;
    approvalTokenContract: TokenAddress | undefined;
    source: 'heading' | 'button';
    routeName?: string;
    isBumpFeeRbfAction?: boolean;
};

const getTranslation = ({
    precomposedForm,
    approvalTokenContract,
    source,
    routeName,
    isBumpFeeRbfAction = false,
}: GetTranslationParams) =>
    getTransactionReviewModalAction({
        networkSymbol: ETH,
        stakeType: null,
        precomposedForm,
        approvalTokenContract,
        routeName,
        isBumpFeeRbfAction,
        isCancelRbfAction: false,
        source,
    });

describe('getTransactionReviewModalAction', () => {
    it('describes an approval signed outside of any trading or earn form state', () => {
        const precomposedForm = getFormState({
            transactionData: buildApprovalTransactionData({ amount: '1000000', spender: SPENDER }),
        });

        expect(
            getTranslation({
                precomposedForm,
                approvalTokenContract: TOKEN_CONTRACT,
                source: 'heading',
            }),
        ).toEqual({
            id: 'TR_APPROVAL_APPROVE_TOKEN_SPENDING',
            assets: { displaySymbol: { networkSymbol: ETH, contractAddress: TOKEN_CONTRACT } },
        });
        expect(
            getTranslation({
                precomposedForm,
                approvalTokenContract: TOKEN_CONTRACT,
                source: 'button',
            }),
        ).toEqual({
            id: 'TR_APPROVE_DATA_TITLE',
        });
    });

    it('describes a revocation', () => {
        const precomposedForm = getFormState({
            transactionData: buildApprovalTransactionData({ amount: '0', spender: SPENDER }),
        });

        expect(
            getTranslation({
                precomposedForm,
                approvalTokenContract: TOKEN_CONTRACT,
                source: 'heading',
            }),
        ).toEqual({
            id: 'TR_APPROVAL_REVOKE_TOKEN_SPENDING',
            assets: { displaySymbol: { networkSymbol: ETH, contractAddress: TOKEN_CONTRACT } },
        });
        expect(
            getTranslation({
                precomposedForm,
                approvalTokenContract: TOKEN_CONTRACT,
                source: 'button',
            }),
        ).toEqual({
            id: 'TR_REVOKE_DATA_TITLE',
        });
    });

    it('falls back to the symbol-less title when the approved token is unknown', () => {
        const precomposedForm = getFormState({
            transactionData: buildApprovalTransactionData({ amount: '1000000', spender: SPENDER }),
        });

        expect(
            getTranslation({
                precomposedForm,
                approvalTokenContract: undefined,
                source: 'heading',
            }),
        ).toEqual({ id: 'TR_APPROVE_DATA_TITLE' });
    });

    it('keeps describing a fee bump of a pending approval as a replacement', () => {
        const precomposedForm = getFormState({
            transactionData: buildApprovalTransactionData({ amount: '1000000', spender: SPENDER }),
        });

        expect(
            getTranslation({
                precomposedForm,
                approvalTokenContract: TOKEN_CONTRACT,
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
            getTranslation({
                precomposedForm,
                approvalTokenContract: undefined,
                source: 'heading',
            }),
        ).toEqual({ id: 'TR_TRADING_SWAP' });
    });

    it.each([
        ['earn-yield-deposit', 'TR_EARN_YIELD_DEPOSIT', 'TR_EARN_YIELD_DEPOSIT_BUTTON'],
        ['earn-yield-withdraw', 'TR_EARN_YIELD_WITHDRAW_TITLE', 'TR_EARN_YIELD_WITHDRAW'],
        ['earn-yield-claim', 'TR_EARN_YIELD_CLAIM_REWARDS', 'TR_EARN_YIELD_CLAIM'],
    ])('labels the %s review heading and send button separately', (routeName, heading, button) => {
        const precomposedForm = getFormState();

        expect(
            getTranslation({
                precomposedForm,
                approvalTokenContract: undefined,
                source: 'heading',
                routeName,
            }),
        ).toEqual({ id: heading });
        expect(
            getTranslation({
                precomposedForm,
                approvalTokenContract: undefined,
                source: 'button',
                routeName,
            }),
        ).toEqual({ id: button });
    });
});
