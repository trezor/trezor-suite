import { type StateFromReducersMapObject, combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import { localeReducer } from '@suite-native/intl';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';

import { FeeOptionsList, type FeeOptionsListProps } from './FeeOptionsList';
import { createFeeLevel, createFeeLevels } from '../../../__fixtures__/feeLevels';
import { ETH_ACCOUNT_KEY, getWalletState } from '../../../__fixtures__/walletState';
import { useFeesForm } from '../../../hooks/fees/useFeesForm';

// Mock the fee-related selectors
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectConvertedNetworkFeeLevelTimeEstimate: jest.fn(),
    selectConvertedNetworkFeeLevelFeePerUnit: jest.fn(),
}));

const mockSelectConvertedNetworkFeeLevelTimeEstimate = jest.requireMock(
    '@suite-common/wallet-core',
).selectConvertedNetworkFeeLevelTimeEstimate;
const mockSelectConvertedNetworkFeeLevelFeePerUnit = jest.requireMock(
    '@suite-common/wallet-core',
).selectConvertedNetworkFeeLevelFeePerUnit;

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

describe('FeeOptionsList', () => {
    const createMockFeeLevels = () =>
        createFeeLevels({
            economy: { totalSpent: '100000', feePerByte: '4', fee: '1000', feeLimit: '21000' },
            normal: { totalSpent: '100000', feePerByte: '10', fee: '2000', feeLimit: '21000' },
            high: { totalSpent: '100000', feePerByte: '30', fee: '3000', feeLimit: '21000' },
        });

    const defaultProps = {
        feeLevels: createMockFeeLevels(),
        symbol: ethSymbol,
        isLoading: false,
        onSelectedFeeLevel: jest.fn(),
    };

    const defaultWalletState = {
        ...getWalletState(),
        fees: {},
    };

    const reducer = {
        locale: localeReducer,
        wallet: combineReducers({
            settings: createStaticReducer(initialWalletSettingsState),
            accounts: createStaticReducer(defaultWalletState.accounts),
            fiat: createStaticReducer(defaultWalletState.fiat),
            send: createStaticReducer(defaultWalletState.send),
            fees: createStaticReducer(defaultWalletState.fees),
        }),
    } as const;

    const createFeeOptionsStore = (
        preloadedState?: Partial<StateFromReducersMapObject<typeof reducer>>,
    ) =>
        createLightStore({
            reducer,
            preloadedState,
        });

    const renderUseFeesForm = async (
        store: ReturnType<typeof createFeeOptionsStore>,
        accountKey: AccountKey = ETH_ACCOUNT_KEY,
        defaultFeePerUnit?: string,
    ) => {
        const { result } = await renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeePerUnit: defaultFeePerUnit || '1',
                }),
            {
                store,
            },
        );

        return result.current;
    };

    const renderFeeOptionsList = async ({
        preloadedState,
        props,
    }: {
        preloadedState?: Partial<StateFromReducersMapObject<typeof reducer>>;
        props?: Partial<FeeOptionsListProps>;
    }) => {
        const finalProps = { ...defaultProps, ...props };
        const store = createFeeOptionsStore(preloadedState);
        const form = await renderUseFeesForm(store);

        const view = await renderWithStoreProvider(<FeeOptionsList {...finalProps} />, {
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

        return { ...view, form };
    };

    beforeEach(() => {
        // Default mock implementations
        mockSelectConvertedNetworkFeeLevelTimeEstimate.mockReturnValue('~10 minutes');
        mockSelectConvertedNetworkFeeLevelFeePerUnit.mockReturnValue('10');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render all fee options', async () => {
            const { getByText } = await renderFeeOptionsList({});

            expect(getByText(/Low/)).toBeTruthy();
            expect(getByText(/Normal/)).toBeTruthy();
            expect(getByText(/High/)).toBeTruthy();
        });

        it('should show loading state when isLoading is true', async () => {
            const { queryAllByTestId } = await renderFeeOptionsList({
                props: { isLoading: true },
            });

            // Should show skeleton components for all fee options
            expect(queryAllByTestId('BoxSkeleton').length).toBeGreaterThan(0);
        });

        it('should filter out custom and low fee levels for btc network', async () => {
            const feeLevels = {
                ...createMockFeeLevels(),
                custom: createFeeLevel(),
                low: createFeeLevel(),
            };

            const { getByText, queryByText } = await renderFeeOptionsList({
                props: { feeLevels, symbol: btcSymbol },
            });

            expect(getByText(/Low/)).toBeTruthy();
            expect(getByText(/Normal/)).toBeTruthy();
            expect(getByText(/High/)).toBeTruthy();

            // Should not render custom or low levels
            expect(queryByText(/Custom/)).toBeNull();
        });

        it('should work with economy if there is no normal', async () => {
            const all = createMockFeeLevels();
            const feeLevels = {
                economy: all.economy,
                high: all.high,
            };

            const { getByText, queryByText } = await renderFeeOptionsList({
                props: { feeLevels },
            });

            expect(getByText(/Low/)).toBeTruthy();
            expect(queryByText(/Normal/)).toBeNull();
            expect(getByText(/High/)).toBeTruthy();
        });
    });

    describe('Interaction', () => {
        it('should call onSelectedFeeLevel when a fee option is selected', async () => {
            const { getByTestId } = await renderFeeOptionsList({});

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-normal'));

            expect(defaultProps.onSelectedFeeLevel).toHaveBeenCalledWith('normal');
        });

        it('should handle different fee level selections', async () => {
            const { getByTestId } = await renderFeeOptionsList({});

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-economy'));
            expect(defaultProps.onSelectedFeeLevel).toHaveBeenCalledWith('economy');

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-high'));
            expect(defaultProps.onSelectedFeeLevel).toHaveBeenCalledWith('high');
        });

        it('should update the visually selected fee option', async () => {
            const { getByTestId, form } = await renderFeeOptionsList({});
            await act(() => form.setValue('feeLevel', 'normal'));

            expect(getByTestId('@transactionManagement/fees-level-radio-normal')).toHaveProp(
                'accessibilityState',
                expect.objectContaining({ checked: true }),
            );
            expect(getByTestId('@transactionManagement/fees-level-radio-high')).toHaveProp(
                'accessibilityState',
                expect.objectContaining({ checked: false }),
            );

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-high'));

            expect(form.getValues('feeLevel')).toBe('high');
            expect(getByTestId('@transactionManagement/fees-level-radio-normal')).toHaveProp(
                'accessibilityState',
                expect.objectContaining({ checked: false }),
            );
            expect(getByTestId('@transactionManagement/fees-level-radio-high')).toHaveProp(
                'accessibilityState',
                expect.objectContaining({ checked: true }),
            );
        });

        it('should make options interactive when multiple options are available', async () => {
            const { getByTestId } = await renderFeeOptionsList({});

            // Should have radio buttons when multiple options are available
            expect(getByTestId('@transactionManagement/fees-level-radio-normal')).toBeTruthy();
            expect(getByTestId('@transactionManagement/fees-level-radio-economy')).toBeTruthy();
            expect(getByTestId('@transactionManagement/fees-level-radio-high')).toBeTruthy();
        });

        it('should make options non-interactive when only one option is available', async () => {
            const singleFeeLevel = {
                normal: createFeeLevel(),
            };

            const { queryByTestId } = await renderFeeOptionsList({
                props: { feeLevels: singleFeeLevel },
            });

            // Should not have radio buttons when only one option is available
            expect(queryByTestId('@transactionManagement/fees-level-radio-normal')).toBeNull();
        });
    });
});
