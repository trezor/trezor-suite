import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    TestStore,
    initStore,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { FeesFormType } from '../../../..';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { useFeesForm } from '../../../../hooks';
import { CustomFeeInputs, CustomFeeInputsProps } from '../CustomFeeInputs';

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

    const renderUseFeesForm = async (
        accountKey: AccountKey = 'eth-account-1',
        preloadedState?: PreloadedState,
        defaultFeePerUnit?: string,
    ) => {
        const { result } = await renderHookWithStoreProviderAsync(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeePerUnit: defaultFeePerUnit || '1',
                }),
            {
                store,
                preloadedState: preloadedState || defaultState,
            },
        );

        return result.current;
    };

    const renderCustomFeeInputs = ({
        form,
        preloadedState,
        props,
    }: {
        form: FeesFormType;
        preloadedState?: PreloadedState;
        props?: Partial<CustomFeeInputsProps>;
    }) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithStoreProviderAsync(<CustomFeeInputs {...finalProps} />, {
            preloadedState: preloadedState || defaultState,
            store,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
    };

    beforeEach(() => {
        store = initStore(defaultState).store;
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
        it('should render fee per unit input for bitcoin', async () => {
            const form = await renderUseFeesForm();
            const { getByText, getByTestId } = await renderCustomFeeInputs({
                form,
            });
            expect(getByText('Fee rate')).toBeTruthy();
            expect(getByTestId('@transactionManagement/customFeePerUnit-input')).toBeTruthy();
        });

        it('should render fee per unit input for ethereum', async () => {
            const form = await renderUseFeesForm();
            const { getByText, getByTestId } = await renderCustomFeeInputs({
                form,
                props: { symbol: 'eth' },
            });

            expect(getByText('Gas price')).toBeTruthy();
            expect(getByTestId('@transactionManagement/customFeePerUnit-input')).toBeTruthy();
        });

        it('should render fee limit input for ethereum', async () => {
            const form = await renderUseFeesForm();
            const { getByText, getByTestId } = await renderCustomFeeInputs({
                form,
                props: { symbol: 'eth' },
            });

            expect(getByText('Gas limit')).toBeTruthy();
            expect(getByTestId('@transactionManagement/customFeeLimit-input')).toBeTruthy();
        });

        it('should not render fee limit input for bitcoin', async () => {
            const form = await renderUseFeesForm();
            const { queryByText, queryByTestId } = await renderCustomFeeInputs({
                form,
                props: { symbol: 'btc' },
            });
            expect(queryByText('Gas limit')).toBeNull();
            expect(queryByTestId('@transactionManagement/customFeeLimit-input')).toBeNull();
        });

        it('should display correct units for different networks', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeInputs({
                form,
                props: { symbol: 'btc' },
            });
            expect(getByText('sat/vB')).toBeTruthy();

            const { getByText: getByText2 } = await renderCustomFeeInputs({
                form,
                props: { symbol: 'eth' },
            });
            expect(getByText2('Gwei')).toBeTruthy();
        });

        it('should show minimum fee hint for bitcoin', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeInputs({
                form,
                props: { symbol: 'btc' },
            });
            expect(getByText('The minimum fee rate is 1 sat/vB')).toBeTruthy();
        });

        it('should not show minimum fee hint for ethereum', async () => {
            const form = await renderUseFeesForm();
            const { queryByText } = await renderCustomFeeInputs({
                form,
                props: { symbol: 'eth' },
            });
            expect(queryByText('The minimum fee rate is 1 Gwei')).toBeNull();
        });
    });
});
