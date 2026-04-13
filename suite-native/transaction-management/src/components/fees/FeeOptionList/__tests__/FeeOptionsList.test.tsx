import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type GeneralPrecomposedLevels } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    type PreloadedState,
    type TestStore,
    initStore,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';

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
    let store: TestStore;

    const createMockFeeLevel = () =>
        ({
            type: 'final',
            totalSpent: '100000',
            fee: '1000',
            feePerByte: '10',
            bytes: 250,
            feeLimit: '21000',
        }) as any;

    const createMockFeeLevels = (): GeneralPrecomposedLevels => ({
        economy: { ...createMockFeeLevel(), feePerByte: '4', fee: '1000', bytes: 250 },
        normal: { ...createMockFeeLevel(), feePerByte: '10', fee: '2000', bytes: 250 },
        high: { ...createMockFeeLevel(), feePerByte: '30', fee: '3000', bytes: 250 },
    });

    const defaultProps = {
        feeLevels: createMockFeeLevels(),
        symbol: 'eth' as NetworkSymbol,
        isLoading: false,
        onSelectedFeeLevel: jest.fn(),
    };

    const defaultState = {
        wallet: getWalletState(),
    };

    const renderUseFeesForm = (
        accountKey: AccountKey = 'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`,
        preloadedState?: PreloadedState,
        defaultFeePerUnit?: string,
    ) => {
        const { result } = renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeePerUnit: defaultFeePerUnit || '1',
                }),
            {
                preloadedState: preloadedState || defaultState,
            },
        );

        return result.current;
    };

    const renderFeeOptionsList = ({
        preloadedState,
        props,
    }: {
        preloadedState?: PreloadedState;
        props?: Partial<FeeOptionsListProps>;
    }) => {
        const finalProps = { ...defaultProps, ...props };
        const form = renderUseFeesForm();

        return renderWithStoreProvider(<FeeOptionsList {...finalProps} />, {
            store,
            preloadedState: preloadedState || defaultState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
    };

    beforeEach(() => {
        store = initStore(defaultState).store;

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
                custom: createMockFeeLevel(),
                low: createMockFeeLevel(),
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
            const feeLevels = {
                economy: createMockFeeLevels().economy,
                high: createMockFeeLevels().high,
            } as GeneralPrecomposedLevels;

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
                normal: createMockFeeLevel(),
            };

            const { queryByTestId } = renderFeeOptionsList({
                props: { feeLevels: singleFeeLevel },
            });

            // Should not have radio buttons when only one option is available
            expect(queryByTestId('@transactionManagement/fees-level-radio-normal')).toBeNull();
        });
    });
});
