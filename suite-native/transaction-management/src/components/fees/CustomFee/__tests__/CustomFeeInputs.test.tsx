import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    type TestStore,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { type FeesFormType } from '../../../..';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { useFeesForm } from '../../../../hooks';
import { CustomFeeInputs, type CustomFeeInputsProps } from '../CustomFeeInputs';

// Mock the selectors
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectConvertedNetworkFeeInfo: jest.fn(),
}));

const mockSelectConvertedNetworkFeeInfo = jest.requireMock(
    '@suite-common/wallet-core',
).selectConvertedNetworkFeeInfo;

describe('CustomFeeInputs', () => {
    let store: TestStore;

    const defaultProps = {
        symbol: 'btc' as NetworkSymbol,
    };
    const defaultState = {
        wallet: getWalletState(),
    };

    const renderUseFeesForm = (
        accountKey: AccountKey = 'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`,
    ) => {
        const { result } = renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeePerUnit: '1',
                }),
            {
                store,
                preloadedState: defaultState,
                providers: ['intl'],
            },
        );

        return result.current;
    };

    const renderCustomFeeInputs = ({
        form,
        props,
    }: {
        form: FeesFormType;
        props?: Partial<CustomFeeInputsProps>;
    }) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithStoreProvider(<CustomFeeInputs {...finalProps} />, {
            preloadedState: defaultState,
            store,
            providers: ['intl', 'formatter'],
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
    };

    beforeEach(() => {
        store = createStoreFromPreloadedState(defaultState);
        // Default mock implementations
        mockSelectConvertedNetworkFeeInfo.mockReturnValue({
            minFee: '1',
            maxFee: '100',
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('Rendering', () => {
        it('should render fee per unit input for bitcoin', () => {
            const form = renderUseFeesForm();
            const { getByText, getByTestId } = renderCustomFeeInputs({
                form,
            });
            expect(getByText('Fee rate')).toBeTruthy();
            expect(getByTestId('@transactionManagement/customFeePerUnit-input')).toBeTruthy();
        });

        it('should render fee per unit input for ethereum', () => {
            const form = renderUseFeesForm();
            const { getByText, getByTestId } = renderCustomFeeInputs({
                form,
                props: { symbol: 'eth' },
            });

            expect(getByText('Gas price')).toBeTruthy();
            expect(getByTestId('@transactionManagement/customFeePerUnit-input')).toBeTruthy();
        });

        it('should render fee limit input for ethereum', () => {
            const form = renderUseFeesForm();
            const { getByText, getByTestId } = renderCustomFeeInputs({
                form,
                props: { symbol: 'eth' },
            });

            expect(getByText('Gas limit')).toBeTruthy();
            expect(getByTestId('@transactionManagement/customFeeLimit-input')).toBeTruthy();
        });

        it('should not render fee limit input for bitcoin', () => {
            const form = renderUseFeesForm();
            const { queryByText, queryByTestId } = renderCustomFeeInputs({
                form,
                props: { symbol: 'btc' },
            });
            expect(queryByText('Gas limit')).toBeNull();
            expect(queryByTestId('@transactionManagement/customFeeLimit-input')).toBeNull();
        });

        it('should display correct units for different networks', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeInputs({
                form,
                props: { symbol: 'btc' },
            });
            expect(getByText('sat/vB')).toBeTruthy();

            const { getByText: getByText2 } = renderCustomFeeInputs({
                form,
                props: { symbol: 'eth' },
            });
            expect(getByText2('Gwei')).toBeTruthy();
        });

        it('should show minimum fee hint for bitcoin', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeInputs({
                form,
                props: { symbol: 'btc' },
            });
            expect(getByText('The minimum fee rate is 1 sat/vB')).toBeTruthy();
        });

        it('should not show minimum fee hint for ethereum', () => {
            const form = renderUseFeesForm();
            const { queryByText } = renderCustomFeeInputs({
                form,
                props: { symbol: 'eth' },
            });
            expect(queryByText('The minimum fee rate is 1 Gwei')).toBeNull();
        });
    });
});
