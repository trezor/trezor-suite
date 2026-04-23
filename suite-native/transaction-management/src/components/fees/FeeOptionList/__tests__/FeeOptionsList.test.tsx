import { type StateFromReducersMapObject, combineReducers } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import { localeReducer } from '@suite-native/intl';
import {
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';

import { createFeeLevel, createFeeLevels } from '../../../../__fixtures__/feeLevels';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { useFeesForm } from '../../../../hooks/fees/useFeesForm';
import { FeeOptionsList, type FeeOptionsListProps } from '../FeeOptionsList';

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

describe('FeeOptionsList', () => {
    const createMockFeeLevels = () =>
        createFeeLevels({
            economy: { totalSpent: '100000', feePerByte: '4', fee: '1000', feeLimit: '21000' },
            normal: { totalSpent: '100000', feePerByte: '10', fee: '2000', feeLimit: '21000' },
            high: { totalSpent: '100000', feePerByte: '30', fee: '3000', feeLimit: '21000' },
        });

    const defaultProps = {
        feeLevels: createMockFeeLevels(),
        symbol: 'eth' as NetworkSymbol,
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

    const renderUseFeesForm = (
        store: ReturnType<typeof createFeeOptionsStore>,
        accountKey: AccountKey = 'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`,
        defaultFeePerUnit?: string,
    ) => {
        const { result } = renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeePerUnit: defaultFeePerUnit || '1',
                }),
            {
                store,
                providers: ['intl'],
            },
        );

        return result.current;
    };

    const renderFeeOptionsList = ({
        preloadedState,
        props,
    }: {
        preloadedState?: Partial<StateFromReducersMapObject<typeof reducer>>;
        props?: Partial<FeeOptionsListProps>;
    }) => {
        const finalProps = { ...defaultProps, ...props };
        const store = createFeeOptionsStore(preloadedState);
        const form = renderUseFeesForm(store);

        return renderWithStoreProvider(<FeeOptionsList {...finalProps} />, {
            store,
            providers: ['intl', 'formatter'],
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
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
        it('should render all fee options', () => {
            const { getByText } = renderFeeOptionsList({});

            expect(getByText(/Low/)).toBeTruthy();
            expect(getByText(/Normal/)).toBeTruthy();
            expect(getByText(/High/)).toBeTruthy();
        });

        it('should show loading state when isLoading is true', () => {
            const { queryAllByTestId } = renderFeeOptionsList({
                props: { isLoading: true },
            });

            // Should show skeleton components for all fee options
            expect(queryAllByTestId('BoxSkeleton').length).toBeGreaterThan(0);
        });

        it('should filter out custom and low fee levels for btc network', () => {
            const feeLevels = {
                ...createMockFeeLevels(),
                custom: createFeeLevel(),
                low: createFeeLevel(),
            };

            const { getByText, queryByText } = renderFeeOptionsList({
                props: { feeLevels, symbol: 'btc' },
            });

            expect(getByText(/Low/)).toBeTruthy();
            expect(getByText(/Normal/)).toBeTruthy();
            expect(getByText(/High/)).toBeTruthy();

            // Should not render custom or low levels
            expect(queryByText(/Custom/)).toBeNull();
        });

        it('should work with economy if there is no normal', () => {
            const all = createMockFeeLevels();
            const feeLevels = {
                economy: all.economy,
                high: all.high,
            };

            const { getByText, queryByText } = renderFeeOptionsList({
                props: { feeLevels },
            });

            expect(getByText(/Low/)).toBeTruthy();
            expect(queryByText(/Normal/)).toBeNull();
            expect(getByText(/High/)).toBeTruthy();
        });
    });

    describe('Interaction', () => {
        it('should call onSelectedFeeLevel when a fee option is selected', async () => {
            const { getByTestId } = renderFeeOptionsList({});

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-normal'));

            expect(defaultProps.onSelectedFeeLevel).toHaveBeenCalledWith('normal');
        });

        it('should handle different fee level selections', async () => {
            const { getByTestId } = renderFeeOptionsList({});

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-economy'));
            expect(defaultProps.onSelectedFeeLevel).toHaveBeenCalledWith('economy');

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-high'));
            expect(defaultProps.onSelectedFeeLevel).toHaveBeenCalledWith('high');
        });

        it('should make options interactive when multiple options are available', () => {
            const { getByTestId } = renderFeeOptionsList({});

            // Should have radio buttons when multiple options are available
            expect(getByTestId('@transactionManagement/fees-level-radio-normal')).toBeTruthy();
            expect(getByTestId('@transactionManagement/fees-level-radio-economy')).toBeTruthy();
            expect(getByTestId('@transactionManagement/fees-level-radio-high')).toBeTruthy();
        });

        it('should make options non-interactive when only one option is available', () => {
            const singleFeeLevel = {
                normal: createFeeLevel(),
            };

            const { queryByTestId } = renderFeeOptionsList({
                props: { feeLevels: singleFeeLevel },
            });

            // Should not have radio buttons when only one option is available
            expect(queryByTestId('@transactionManagement/fees-level-radio-normal')).toBeNull();
        });
    });
});
