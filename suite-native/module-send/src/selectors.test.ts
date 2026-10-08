import { asNetworkSymbol } from '@suite-common/wallet-config';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    type FormState,
    type GeneralPrecomposedTransaction,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getSendFormDraftKey } from '@suite-common/wallet-utils';
import { type NativeSendRootState } from '@suite-native/transaction-management';

import {
    type CardanoTokenSendRootState,
    selectCardanoTokenSendMinAdaAmount,
    selectDestinationTagFromDraft,
    selectIsCardanoTokenSendAdaInsufficient,
} from './selectors';

const createMockState = (
    overrides: Partial<NativeSendRootState['wallet']['send']> = {},
): NativeSendRootState => ({
    wallet: {
        send: {
            feeLevels: {},
            error: null,
            drafts: {},
            ...overrides,
        },
    },
});

const btcAccountKey = mockAccountKey({ symbol: asNetworkSymbol('btc'), descriptor: 'btc0' });
const ethAccountKey = mockAccountKey({ symbol: asNetworkSymbol('eth'), descriptor: 'eth0' });

describe('send selectors', () => {
    describe('selectDestinationTagFromDraft', () => {
        it('should return destination tag when it exists in draft', () => {
            const mockDrafts = {
                [btcAccountKey]: {
                    destinationTag: '12345',
                    outputs: [],
                    selectedFee: 'normal',
                },
            };

            // Cast mockDrafts to the correct type to satisfy FormState requirements
            const mockDraftsTyped: Record<string, FormState> = mockDrafts as unknown as Record<
                string,
                FormState
            >;

            const state = createMockState({ drafts: mockDraftsTyped });
            const result = selectDestinationTagFromDraft(state, btcAccountKey);

            expect(result).toBe('12345');
        });

        it('should return undefined when draft does not exist', () => {
            const state = createMockState();
            const result = selectDestinationTagFromDraft(state, btcAccountKey);

            expect(result).toBeUndefined();
        });

        it('should handle token contract parameter', () => {
            const mockDrafts = {
                [`${ethAccountKey}-0x1234567890123456789012345678901234567890`]: {
                    destinationTag: '67890',
                    outputs: [],
                    selectedFee: 'normal',
                },
            };

            const mockDraftsTyped: Record<string, FormState> = mockDrafts as unknown as Record<
                string,
                FormState
            >;

            const state = createMockState({ drafts: mockDraftsTyped });
            const result = selectDestinationTagFromDraft(
                state,
                ethAccountKey,
                '0x1234567890123456789012345678901234567890' as TokenAddress,
            );

            expect(result).toBe('67890');
        });
    });

    describe('Cardano token minimum ADA', () => {
        const tokenContract = 'policyIdAssetName' as TokenAddress;
        const adaAccount = mockWalletAccount({ symbol: asNetworkSymbol('ada') });
        const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
        const composedFeeLevel: GeneralPrecomposedTransaction = {
            type: 'nonfinal',
            fee: '170000',
            feePerByte: '44',
            bytes: 0,
            totalSpent: '1340000',
            max: undefined,
        };

        const createCardanoTokenDraft = (): FormState => ({
            ...DEFAULT_VALUES,
            options: ['broadcast'],
            selectedUtxos: [],
            outputs: [{ ...DEFAULT_PAYMENT, token: tokenContract }],
        });

        const createState = ({
            feeLevels = {},
            balance = '1500000',
            hasDraft = true,
        }: {
            feeLevels?: NativeSendRootState['wallet']['send']['feeLevels'];
            balance?: string;
            hasDraft?: boolean;
        } = {}): CardanoTokenSendRootState => {
            const drafts = hasDraft
                ? {
                      [getSendFormDraftKey(adaAccount.key, tokenContract)]:
                          createCardanoTokenDraft(),
                  }
                : {};
            const { wallet } = createMockState({ feeLevels, drafts });

            return {
                wallet: { ...wallet, accounts: [{ ...adaAccount, balance }, btcAccount] },
            };
        };

        describe('selectCardanoTokenSendMinAdaAmount', () => {
            it('returns undefined outside the Cardano token flow', () => {
                const state = createState();

                expect(selectCardanoTokenSendMinAdaAmount(state, adaAccount.key)).toBeUndefined();
                expect(
                    selectCardanoTokenSendMinAdaAmount(state, btcAccount.key, tokenContract),
                ).toBeUndefined();
            });

            it('returns null while the transaction is composing', () => {
                const state = createState({ hasDraft: false });

                expect(
                    selectCardanoTokenSendMinAdaAmount(state, adaAccount.key, tokenContract),
                ).toBeNull();
            });

            it('estimates 1 ADA when composing failed', () => {
                const state = createState({
                    hasDraft: false,
                    feeLevels: { normal: { type: 'error', error: 'UTXO_BALANCE_INSUFFICIENT' } },
                });

                expect(
                    selectCardanoTokenSendMinAdaAmount(
                        state,
                        adaAccount.key,
                        tokenContract,
                    )?.toFixed(),
                ).toBe('1000000');
            });

            it('returns the same reference while inputs are unchanged', () => {
                const state = createState({ feeLevels: { normal: composedFeeLevel } });

                expect(
                    selectCardanoTokenSendMinAdaAmount(state, adaAccount.key, tokenContract),
                ).toBe(selectCardanoTokenSendMinAdaAmount(state, adaAccount.key, tokenContract));
            });

            it('returns totalSpent of the composed fee level', () => {
                const state = createState({ feeLevels: { normal: composedFeeLevel } });

                expect(
                    selectCardanoTokenSendMinAdaAmount(
                        state,
                        adaAccount.key,
                        tokenContract,
                    )?.toFixed(),
                ).toBe('1340000');
            });
        });

        describe('selectIsCardanoTokenSendAdaInsufficient', () => {
            it('returns false when the ADA balance covers the minimum ADA', () => {
                const state = createState({ feeLevels: { normal: composedFeeLevel } });

                expect(
                    selectIsCardanoTokenSendAdaInsufficient(state, adaAccount.key, tokenContract),
                ).toBe(false);
            });

            it('returns true when the ADA balance is below the minimum ADA', () => {
                const state = createState({
                    feeLevels: { normal: composedFeeLevel },
                    balance: '1200000',
                });

                expect(
                    selectIsCardanoTokenSendAdaInsufficient(state, adaAccount.key, tokenContract),
                ).toBe(true);
            });

            it('returns true when composing failed on insufficient balance', () => {
                const state = createState({
                    feeLevels: { normal: { type: 'error', error: 'UTXO_BALANCE_INSUFFICIENT' } },
                });

                expect(
                    selectIsCardanoTokenSendAdaInsufficient(state, adaAccount.key, tokenContract),
                ).toBe(true);
            });

            it('returns false outside the Cardano token flow', () => {
                const state = createState({ balance: '0' });

                expect(selectIsCardanoTokenSendAdaInsufficient(state, adaAccount.key)).toBe(false);
            });
        });
    });
});
