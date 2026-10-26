import { type Store, combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FeesRootState,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    initialWalletSettingsState,
} from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import { type LocaleSliceRootState, localeReducer } from '@suite-native/intl';
import {
    type PreloadedStatePartial,
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
import { type NativeSendRootState, sendFormInitialState } from '../../../sendFormSlice';

type State = AccountsRootState &
    FeesRootState &
    WalletSettingsRootState &
    FiatRatesRootState &
    LocaleSliceRootState &
    NativeSendRootState;

// Mock the fee-related selectors
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectConvertedNetworkFeeLevelTimeEstimate: jest.fn(),
    selectNetworkFeeLevel: jest.fn(),
}));

const mockSelectConvertedNetworkFeeLevelTimeEstimate = jest.requireMock(
    '@suite-common/wallet-core',
).selectConvertedNetworkFeeLevelTimeEstimate;
const mockSelectNetworkFeeLevel = jest.requireMock(
    '@suite-common/wallet-core',
).selectNetworkFeeLevel;

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
            send: createStaticReducer({ ...sendFormInitialState, ...defaultWalletState.send }),
            fees: createStaticReducer(defaultWalletState.fees),
        }),
    } as const;

    const createFeeOptionsStore = (preloadedState?: PreloadedStatePartial<State>): Store<State> =>
        createLightStore({
            reducer,
            preloadedState,
        });

    const renderUseFeesForm = async (
        store: Store<State>,
        accountKey: AccountKey = ETH_ACCOUNT_KEY,
        defaultFeePerUnit?: string,
    ) => {
        const { result } = await renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeePerUnit: defaultFeePerUnit || '1',
                }),
            { services: { store } },
        );

        return result.current;
    };

    const renderFeeOptionsList = async ({
        preloadedState,
        props,
    }: {
        preloadedState?: PreloadedStatePartial<State>;
        props?: Partial<FeeOptionsListProps>;
    }) => {
        const finalProps = { ...defaultProps, ...props };
        const store = createFeeOptionsStore(preloadedState);
        const form = await renderUseFeesForm(store);

        const view = await renderWithStoreProvider(<FeeOptionsList {...finalProps} />, {
            services: { store },
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

        return { ...view, form };
    };

    beforeEach(() => {
        // Default mock implementations
        mockSelectConvertedNetworkFeeLevelTimeEstimate.mockReturnValue('~10 minutes');
        mockSelectNetworkFeeLevel.mockReturnValue({ label: 'normal', feePerUnit: '10', blocks: 2 });
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

        it.each(['eth', 'btc'] as const)(
            'orders %s levels from low to high regardless of composition order',
            async symbol => {
                const { getAllByTestId } = await renderFeeOptionsList({
                    props: {
                        symbol: asNetworkSymbol(symbol),
                        feeLevels: {
                            high: createFeeLevel(),
                            normal: createFeeLevel(),
                            ...(symbol === 'btc'
                                ? { economy: createFeeLevel(), low: createFeeLevel() }
                                : { low: createFeeLevel() }),
                            custom: createFeeLevel(),
                        },
                    },
                });

                expect(
                    getAllByTestId(/@transactionManagement\/fees-level-container-/).map(
                        option => option.props.testID,
                    ),
                ).toEqual(
                    [symbol === 'btc' ? 'economy' : 'low', 'normal', 'high'].map(
                        level => `@transactionManagement/fees-level-container-${level}`,
                    ),
                );
            },
        );

        it('shows estimates for unaffordable Normal and High using the available Low gas limit', async () => {
            mockSelectNetworkFeeLevel.mockImplementation(
                (_state: State, _symbol: string, label: string) => ({
                    label,
                    feePerUnit: label === 'high' ? '12' : '10',
                    blocks: 2,
                }),
            );
            const { getByText, queryByText, getAllByTestId } = await renderFeeOptionsList({
                props: {
                    feeLevels: {
                        normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                        high: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                        low: createFeeLevel({
                            bytes: 0,
                            fee: '8000000000000000',
                            feePerByte: '8',
                            feeLimit: '1000000',
                        }),
                    },
                },
            });

            expect(getByText(/0\.008\s*ETH/)).toBeOnTheScreen();
            expect(getByText(/0\.01\s*ETH/)).toBeOnTheScreen();
            expect(getByText(/0\.012\s*ETH/)).toBeOnTheScreen();
            expect(getByText('10.0000 Gwei')).toBeOnTheScreen();
            expect(getByText('12.0000 Gwei')).toBeOnTheScreen();
            expect(queryByText('Unavailable')).toBeNull();
            expect(
                getAllByTestId(/@transactionManagement\/fees-level-container-/).map(
                    option => option.props.testID,
                ),
            ).toEqual([
                '@transactionManagement/fees-level-container-low',
                '@transactionManagement/fees-level-container-normal',
                '@transactionManagement/fees-level-container-high',
            ]);
        });

        it('does not use a manually edited Custom gas limit to estimate Standard fees', async () => {
            const { getByText, queryByText } = await renderFeeOptionsList({
                props: {
                    feeLevels: {
                        normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                        custom: createFeeLevel({ feeLimit: '2000000' }),
                    },
                },
            });

            expect(getByText('10.0000 Gwei')).toBeOnTheScreen();
            expect(getByText('Unavailable')).toBeOnTheScreen();
            expect(queryByText(/0\.02\s*ETH/)).toBeNull();
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

        it('uses each Bitcoin level size for its rate, independent of custom insertion order', async () => {
            const { getByText, getByTestId, form } = await renderFeeOptionsList({
                props: {
                    symbol: btcSymbol,
                    feeLevels: {
                        custom: createFeeLevel({ bytes: 100 }),
                        high: createFeeLevel({ bytes: 300, fee: '9000' }),
                        normal: createFeeLevel({ bytes: 200, fee: '2000' }),
                        economy: createFeeLevel({ bytes: 250, fee: '1000' }),
                    },
                },
            });

            expect(getByText('4 sat/vB')).toBeOnTheScreen();
            expect(getByText('10 sat/vB')).toBeOnTheScreen();
            expect(getByText('30 sat/vB')).toBeOnTheScreen();
            await act(() => form.setValue('feeLevel', 'economy'));
            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-normal'));
            expect(form.getValues('customFeePerUnit')).toBe('10');
        });

        it('keeps confirmed custom fields when selecting an unavailable level', async () => {
            const { getByTestId, form } = await renderFeeOptionsList({
                props: {
                    feeLevels: {
                        normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                        low: createFeeLevel(),
                    },
                },
            });
            const customValues = {
                customFeePerUnit: '9',
                customFeeLimit: '21000',
                customMaxFeePerGas: '9',
                customMaxPriorityFeePerGas: '1',
            };
            await act(() => {
                form.setValue('feeLevel', 'low');
                Object.entries(customValues).forEach(([key, value]) =>
                    form.setValue(key as keyof typeof customValues, value),
                );
            });

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-normal'));

            expect(form.getValues()).toEqual(expect.objectContaining(customValues));
            expect(form.getValues('feeLevel')).toBe('normal');
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
