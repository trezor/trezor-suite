import { useForm } from 'react-hook-form';

import { combineReducers } from '@reduxjs/toolkit';
import { act, waitFor } from '@testing-library/react';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { createTestStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingSellFormProps } from '@suite-common/trading';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { prepareWalletSettingsReducer, setNetworkReserve } from '@suite-common/wallet-core';
import { type Account, type PrecomposedLevels } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { validateNetworkReserve } from 'src/utils/suite/validation';
import { getComposeAddressPlaceholder } from 'src/utils/wallet/trading/tradingUtils';

import { useTradingComposeTransaction } from './useTradingComposeTransaction';

let mockComposedLevels: PrecomposedLevels | undefined;

const STALE_ADDRESS = 'stale-btc-placeholder';
const BTC_PLACEHOLDER = 'btc-placeholder-address';
const SOL_PLACEHOLDER = 'sol-placeholder-address';
const EXTERNAL_ADDRESS = 'external-address-set-meanwhile';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    useTranslation: () => ({ translationString: (id: string) => id }),
}));

jest.mock('src/hooks/wallet/form/useCompose', () => ({
    useCompose: () => ({
        isLoading: false,
        composeRequest: jest.fn(),
        composedLevels: mockComposedLevels,
        onFeeLevelChange: jest.fn(),
        setComposedLevels: jest.fn(),
    }),
}));

jest.mock('src/hooks/wallet/form/useFees', () => ({
    useFees: () => ({ changeFeeLevel: jest.fn(), selectedFee: 'normal' }),
}));

jest.mock('src/utils/wallet/trading/tradingUtils', () => ({
    ...jest.requireActual('src/utils/wallet/trading/tradingUtils'),
    getComposeAddressPlaceholder: jest.fn(),
}));

const mockGetComposeAddressPlaceholder = getComposeAddressPlaceholder as jest.Mock;

const BTC_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('btc'), formattedBalance: '2' });
const SOL_ACCOUNT = mockWalletAccount({ symbol: asNetworkSymbol('sol'), formattedBalance: '0.4' });

const walletSettingsReducer = prepareWalletSettingsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadWalletSettings: mockReducer() },
});

const feeData = (blockTime: number) => ({
    blockHeight: 0,
    blockTime,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: -1,
    dustLimit: -1,
    levels: [{ label: 'normal' as const, feePerUnit: '2', blocks: 2 }],
});

const buildDefaults = (): TradingSellFormProps =>
    ({
        outputs: [
            {
                type: 'payment',
                address: STALE_ADDRESS,
                amount: '',
                fiat: '',
                currency: { value: 'usd', label: 'USD' },
                token: null,
                label: '',
            },
        ],
        amountInCrypto: true,
        options: ['broadcast'],
        feePerUnit: '',
        feeLimit: '',
        transactionData: '',
        destinationTag: '',
    }) as unknown as TradingSellFormProps;

type RenderComposeTransactionProps = {
    account?: Account;
    isTradingDex?: boolean;
    shouldSendInSats?: boolean;
    isNetworkReserveEnabled?: boolean;
};

type ComposeTransactionHookProps = {
    account: Account;
    isTradingDex?: boolean;
    shouldSendInSats?: boolean;
};

const renderComposeTransaction = ({
    account = BTC_ACCOUNT,
    isTradingDex,
    shouldSendInSats,
    isNetworkReserveEnabled = true,
}: RenderComposeTransactionProps = {}) => {
    const store = createTestStore({
        extra: undefined,
        reducer: {
            wallet: combineReducers({
                settings: walletSettingsReducer,
                accounts: (state = [BTC_ACCOUNT, SOL_ACCOUNT]) => state,
                fees: (state = {}) => state,
            }),
            device: (state = {}) => state,
        },
        preloadedState: {
            wallet: {
                accounts: [BTC_ACCOUNT, SOL_ACCOUNT],
                fees: {
                    btc: { status: 'preloaded', data: feeData(600) },
                    sol: { status: 'preloaded', data: feeData(-1) },
                },
                settings: {
                    addressDisplayType: 'original',
                    networkReserve: isNetworkReserveEnabled,
                },
            },
            device: { devices: [], selectedDevice: undefined },
        } as any,
    });

    const initialProps: ComposeTransactionHookProps = { account, isTradingDex, shouldSendInSats };
    const rendered = renderHookWithStoreProvider(
        ({ account, isTradingDex, shouldSendInSats }: ComposeTransactionHookProps) => {
            const methods = useForm<TradingSellFormProps>({
                mode: 'onChange',
                defaultValues: buildDefaults(),
            });
            methods.register('outputs.0.amount', {
                validate: {
                    networkReserve: validateNetworkReserve(id => id, {
                        balance: '2',
                        reserve: '0.00002',
                        fee: '0.0001',
                    }),
                },
            });
            const compose = useTradingComposeTransaction({
                type: 'sell',
                account,
                network: getNetwork(account.symbol),
                methods,
                setShowReserveBanner: jest.fn(),
                isTradingDex,
                shouldSendInSats,
            });

            return { methods, compose };
        },
        { store, initialProps },
    );

    return { ...rendered, store };
};

const mockMaxComposition = (max: string): PrecomposedLevels => ({
    normal: {
        type: 'nonfinal',
        max,
        fee: '10000',
        feePerByte: '1',
        bytes: 100,
        totalSpent: '200000000',
        inputs: [],
    },
});

describe('useTradingComposeTransaction', () => {
    beforeEach(() => {
        mockComposedLevels = undefined;
        mockGetComposeAddressPlaceholder.mockImplementation((account: Account) =>
            Promise.resolve(account.symbol === 'sol' ? SOL_PLACEHOLDER : BTC_PLACEHOLDER),
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        { max: '1.9999', expected: '1.99988' },
        { max: '199990000', shouldSendInSats: true, expected: '199988000' },
        { max: '0.00001', expected: '0' },
        { max: '1.9999', isTradingDex: false, expected: '1.9999' },
        { max: '1.9999', isNetworkReserveEnabled: false, expected: '1.9999' },
        { max: '0.39', account: SOL_ACCOUNT, expected: '0.39' },
    ])('fills Max with the DEX reserve: %j', async ({ max, expected, ...overrides }) => {
        const props = { account: BTC_ACCOUNT, isTradingDex: true, ...overrides };
        const { result, rerender } = renderComposeTransaction(props);

        act(() => result.current.methods.setValue('setMaxOutputId', 0));
        mockComposedLevels = mockMaxComposition(max);
        rerender(props);

        await waitFor(() =>
            expect(result.current.methods.getValues('outputs.0.amount')).toBe(expected),
        );

        mockComposedLevels = mockMaxComposition(max);
        rerender(props);

        await waitFor(() =>
            expect(result.current.methods.getValues('outputs.0.amount')).toBe(expected),
        );
    });

    it('updates active Max when DEX status, the reserve setting, or the composed fee changes', async () => {
        const props = { account: BTC_ACCOUNT, isTradingDex: true };
        const { result, rerender, store } = renderComposeTransaction(props);

        act(() => result.current.methods.setValue('setMaxOutputId', 0));
        mockComposedLevels = mockMaxComposition('1.9999');
        rerender(props);
        await waitFor(() =>
            expect(result.current.methods.getValues('outputs.0.amount')).toBe('1.99988'),
        );

        act(() => {
            store.dispatch(setNetworkReserve(false));
        });
        await waitFor(() =>
            expect(result.current.methods.getValues('outputs.0.amount')).toBe('1.9999'),
        );

        act(() => {
            store.dispatch(setNetworkReserve(true));
        });
        await waitFor(() =>
            expect(result.current.methods.getValues('outputs.0.amount')).toBe('1.99988'),
        );

        rerender({ ...props, isTradingDex: false });
        await waitFor(() =>
            expect(result.current.methods.getValues('outputs.0.amount')).toBe('1.9999'),
        );

        mockComposedLevels = mockMaxComposition('1.9998');
        rerender(props);
        await waitFor(() =>
            expect(result.current.methods.getValues('outputs.0.amount')).toBe('1.99978'),
        );
    });

    it.each(['1.9999', '1.9998'])(
        'validates Max after composition when the amount is unchanged: %s',
        async amount => {
            const { result, rerender } = renderComposeTransaction();
            await act(async () => {
                result.current.methods.setValue('outputs.0.amount', amount);
                result.current.methods.setValue('setMaxOutputId', 0);
                await result.current.methods.trigger('outputs.0.amount');
            });
            mockComposedLevels = {
                normal: {
                    type: 'nonfinal',
                    max: amount,
                    fee: '10000',
                    feePerByte: '1',
                    bytes: 100,
                    totalSpent: '200000000',
                    inputs: [],
                },
            };

            rerender({ account: BTC_ACCOUNT });

            await waitFor(() =>
                expect(result.current.methods.getFieldState('outputs.0.amount').error?.type).toBe(
                    amount === '1.9999' ? 'networkReserve' : undefined,
                ),
            );
        },
    );

    it('refreshes the compose address placeholder when the send account changes', async () => {
        const { result, rerender } = renderComposeTransaction();

        expect(result.current.methods.getValues('outputs.0.address')).toBe(STALE_ADDRESS);

        rerender({ account: SOL_ACCOUNT });

        await waitFor(() =>
            expect(result.current.methods.getValues('outputs.0.address')).toBe(SOL_PLACEHOLDER),
        );
    });

    it('keeps an address set while the placeholder request was in flight', async () => {
        let resolvePlaceholder: (address: string) => void = () => {};
        const pendingPlaceholder = new Promise<string>(resolve => {
            resolvePlaceholder = resolve;
        });
        mockGetComposeAddressPlaceholder.mockReturnValueOnce(pendingPlaceholder);

        const { result, rerender } = renderComposeTransaction();

        rerender({ account: SOL_ACCOUNT });

        act(() => {
            result.current.methods.setValue('outputs.0.address', EXTERNAL_ADDRESS);
        });

        await act(async () => {
            resolvePlaceholder(SOL_PLACEHOLDER);
            await pendingPlaceholder;
        });

        expect(result.current.methods.getValues('outputs.0.address')).toBe(EXTERNAL_ADDRESS);
    });
});
