import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    type TestStore,
    createStoreFromPreloadedState,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { CustomFeeInputs, type CustomFeeInputsProps } from './CustomFeeInputs';
import { type FeesFormType } from '../../..';
import { ETH_ACCOUNT_KEY, getWalletState } from '../../../__fixtures__/walletState';
import { useFeesForm } from '../../../hooks';

// Mock the selectors
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectConvertedNetworkFeeInfo: jest.fn(),
}));

const mockSelectConvertedNetworkFeeInfo = jest.requireMock(
    '@suite-common/wallet-core',
).selectConvertedNetworkFeeInfo;

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

describe('CustomFeeInputs', () => {
    let store: TestStore;

    const defaultProps = {
        symbol: btcSymbol,
    };
    const defaultState = {
        wallet: getWalletState(),
    };

    const renderUseFeesForm = (accountKey: AccountKey = ETH_ACCOUNT_KEY) => {
        const { result } = renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeePerUnit: '1',
                }),
            {
                store,
                preloadedState: defaultState,
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
            expect(
                getByText(
                    getTranslation('transactionManagement.fees.custom.bottomSheet.label.feeRate'),
                ),
            ).toBeTruthy();
            expect(getByTestId('@transactionManagement/customFeePerUnit-input')).toBeTruthy();
        });

        it('should render fee per unit input for ethereum', () => {
            const form = renderUseFeesForm();
            const { getByText, getByTestId } = renderCustomFeeInputs({
                form,
                props: { symbol: ethSymbol },
            });

            expect(
                getByText(
                    getTranslation('transactionManagement.fees.custom.bottomSheet.label.gasPrice'),
                ),
            ).toBeTruthy();
            expect(getByTestId('@transactionManagement/customFeePerUnit-input')).toBeTruthy();
        });

        it('should render fee limit input for ethereum', () => {
            const form = renderUseFeesForm();
            const { getByText, getByTestId } = renderCustomFeeInputs({
                form,
                props: { symbol: ethSymbol },
            });

            expect(
                getByText(
                    getTranslation('transactionManagement.fees.custom.bottomSheet.label.gasLimit'),
                ),
            ).toBeTruthy();
            expect(getByTestId('@transactionManagement/customFeeLimit-input')).toBeTruthy();
        });

        it('should not render fee limit input for bitcoin', () => {
            const form = renderUseFeesForm();
            const { queryByText, queryByTestId } = renderCustomFeeInputs({
                form,
                props: { symbol: btcSymbol },
            });
            expect(
                queryByText(
                    getTranslation('transactionManagement.fees.custom.bottomSheet.label.gasLimit'),
                ),
            ).toBeNull();
            expect(queryByTestId('@transactionManagement/customFeeLimit-input')).toBeNull();
        });

        it('should display correct units for different networks', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeInputs({
                form,
                props: { symbol: btcSymbol },
            });
            expect(getByText('sat/vB')).toBeTruthy();

            const { getByText: getByText2 } = renderCustomFeeInputs({
                form,
                props: { symbol: ethSymbol },
            });
            expect(getByText2('Gwei')).toBeTruthy();
        });

        it('should show minimum fee hint for bitcoin', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeInputs({
                form,
                props: { symbol: btcSymbol },
            });
            expect(
                getByText(
                    getTranslation('transactionManagement.fees.custom.bottomSheet.minimumLabel', {
                        feePerUnit: '1 sat/vB',
                    }),
                ),
            ).toBeTruthy();
        });

        it('should not show minimum fee hint for ethereum', () => {
            const form = renderUseFeesForm();
            const { queryByText } = renderCustomFeeInputs({
                form,
                props: { symbol: ethSymbol },
            });
            expect(
                queryByText(
                    getTranslation('transactionManagement.fees.custom.bottomSheet.minimumLabel', {
                        feePerUnit: '1 Gwei',
                    }),
                ),
            ).toBeNull();
        });
    });
});
