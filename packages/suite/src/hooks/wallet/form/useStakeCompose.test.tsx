import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';

import { act } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type ComposeActionContext,
    type StakeFormState,
    type StakeType,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { composeTransaction } from '#src/actions/wallet/stakeActions';

import { useStakeCompose } from './useStakeCompose';
import { type MockSuiteState } from '../../../../mocks/mockInitialAppState';

jest.mock('#src/actions/wallet/stakeActions', () => ({
    composeTransaction: jest.fn(),
}));

const composeTransactionMock = composeTransaction as jest.Mock;

const composeActionContext = (
    symbol: NetworkSymbol = asNetworkSymbol('ada'),
): ComposeActionContext => ({
    account: mockWalletAccount({ symbol }),
    network: getNetwork(symbol),
    feeInfo: {
        blockHeight: 0,
        blockTime: 20,
        minFee: 44,
        maxFee: 44,
        minPriorityFee: 0,
        levels: [],
    },
});

type RenderStakeComposeParams = {
    symbol?: NetworkSymbol;
    amount?: string;
    stakeType?: StakeType;
};

const renderStakeCompose = ({
    symbol = asNetworkSymbol('ada'),
    amount = '1',
    stakeType = 'unstake',
}: RenderStakeComposeParams = {}) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState: {} });

    return renderHookWithStoreProvider(
        () => {
            const methods = useForm<StakeFormState>({
                defaultValues: { stakeType, outputs: [{ amount }] },
            });

            return {
                ...useStakeCompose({ ...methods, state: composeActionContext(symbol) }),
                getFieldState: methods.getFieldState,
            };
        },
        {
            services,
            wrapper: ({ children }) => <IntlProvider locale="en">{children}</IntlProvider>,
        },
    );
};

describe('useStakeCompose', () => {
    beforeEach(() => {
        composeTransactionMock.mockReset();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('settles a rejected compose instead of letting it escape as an unhandled rejection', async () => {
        const utxoAddress = 'addr1q9utxo';
        composeTransactionMock.mockReturnValue(() =>
            Promise.reject(
                new Error(`Invalid parameter "account.utxo" (= [{"address":"${utxoAddress}"}])`),
            ),
        );

        const { result } = renderStakeCompose();

        await act(async () => {
            await expect(result.current.composeRequest()).resolves.toBeUndefined();
        });

        expect(composeTransactionMock).toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.composedLevels).toBeUndefined();
        expect(result.current.hasComposeError).toBe(true);
    });

    it.each(['ada', 'eth', 'sol'])(
        'reports an unexpected empty compose result for %s',
        async symbol => {
            composeTransactionMock.mockReturnValue(() => Promise.resolve(undefined));

            const { result } = renderStakeCompose({ symbol: asNetworkSymbol(symbol) });

            await act(async () => {
                await result.current.composeRequest();
            });

            expect(result.current.hasComposeError).toBe(true);
            expect(result.current.isLoading).toBe(false);
        },
    );

    it('clears the failure after a successful retry', async () => {
        composeTransactionMock.mockReturnValue(() => Promise.reject(new Error('Unavailable')));
        const { result } = renderStakeCompose();

        await act(async () => {
            await result.current.composeRequest();
        });
        expect(result.current.hasComposeError).toBe(true);

        composeTransactionMock.mockReturnValue(() =>
            Promise.resolve({ normal: { type: 'final' } }),
        );
        await act(async () => {
            await result.current.composeRequest();
        });

        expect(result.current.hasComposeError).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.composedLevels?.normal?.type).toBe('final');
    });

    it.each(['TR_GENERIC_ERROR_TITLE', 'TR_STAKE_TX_PREPARATION_FAILED'])(
        'offers recovery for an unstake preparation error (%s)',
        async errorId => {
            composeTransactionMock.mockReturnValue(() =>
                Promise.resolve({
                    normal: {
                        type: 'error',
                        error: errorId,
                        errorMessage: { id: errorId },
                    },
                }),
            );
            const { result } = renderStakeCompose({ symbol: asNetworkSymbol('sol') });

            await act(async () => {
                await result.current.composeRequest();
            });

            expect(result.current.hasComposeError).toBe(true);
            expect(result.current.isLoading).toBe(false);
        },
    );

    it.each(['', '0', '0.0'])(
        'does not report an empty compose for an incomplete amount (%s)',
        async amount => {
            composeTransactionMock.mockReturnValue(() => Promise.resolve(undefined));
            const { result } = renderStakeCompose({ symbol: asNetworkSymbol('eth'), amount });

            await act(async () => {
                await result.current.composeRequest();
            });

            expect(result.current.hasComposeError).toBe(false);
            expect(result.current.isLoading).toBe(false);
        },
    );

    it('keeps an intentionally empty change-delegate composition free of a retry error', async () => {
        composeTransactionMock.mockReturnValue(() => Promise.resolve(undefined));
        const { result } = renderStakeCompose({ stakeType: 'change-delegate' });

        await act(async () => {
            await result.current.composeRequest();
        });

        expect(result.current.hasComposeError).toBe(false);
        expect(result.current.isLoading).toBe(false);
    });

    it.each([
        ['stake', 'TR_GENERIC_ERROR_TITLE'],
        ['claim', 'TR_GENERIC_ERROR_TITLE'],
        ['stake', 'TR_STAKE_TX_PREPARATION_FAILED'],
        ['claim', 'TR_STAKE_TX_PREPARATION_FAILED'],
    ] as const)(
        'keeps a %s preparation error (%s) visible in the form',
        async (stakeType, errorId) => {
            composeTransactionMock.mockReturnValue(() =>
                Promise.resolve({
                    normal: {
                        type: 'error',
                        error: errorId,
                        errorMessage: { id: errorId },
                    },
                }),
            );
            const { result } = renderStakeCompose({ stakeType });

            await act(async () => {
                await result.current.composeRequest();
            });

            expect(result.current.getFieldState('outputs.0.amount').error?.message).toBe(
                messages[errorId].defaultMessage,
            );
            expect(result.current.isLoading).toBe(false);
        },
    );

    it('does not log the rejection message, which may embed the composed account payload', async () => {
        const utxoAddress = 'addr1q9utxo';
        composeTransactionMock.mockReturnValue(() =>
            Promise.reject(
                new Error(`Invalid parameter "account.utxo" (= [{"address":"${utxoAddress}"}])`),
            ),
        );

        const { result } = renderStakeCompose();

        await act(async () => {
            await result.current.composeRequest();
        });

        expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain(utxoAddress);
    });
});
