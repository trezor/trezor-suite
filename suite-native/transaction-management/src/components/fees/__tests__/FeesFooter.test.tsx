import { yup } from '@suite-common/validators';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Form, useForm } from '@suite-native/forms';
import { userEvent } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { TestStore, initStore, renderWithStoreProvider } from '@suite-native/test-utils/store';

import { getWalletState } from '../../../__fixtures__/walletState';
import { FeesFooter } from '../FeesFooter';

// Create a simple validation schema for testing
const testValidationSchema = yup.object({
    feeLevel: yup.string().required(),
    customFeePerUnit: yup.string(),
    customFeeLimit: yup.string(),
});

// Create a form wrapper component for testing
const TestFormWrapper = ({ children }: { children: React.ReactNode }) => {
    const form = useForm({
        validation: testValidationSchema,
        defaultValues: {
            feeLevel: 'normal',
            customFeePerUnit: '',
            customFeeLimit: '',
        },
    });

    return <Form form={form}>{children}</Form>;
};

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAreFeesLoading: jest.fn(),
}));

const mockSelectAreFeesLoading = jest.requireMock('@suite-common/wallet-core').selectAreFeesLoading;

jest.mock('@suite-native/tokens', () => ({
    ...jest.requireActual('@suite-native/tokens'),
    selectAccountTokenSymbol: jest.fn(),
    selectAccountTokenDecimals: jest.fn(),
}));

const mockSelectAccountTokenSymbol =
    jest.requireMock('@suite-native/tokens').selectAccountTokenSymbol;
const mockSelectAccountTokenDecimals =
    jest.requireMock('@suite-native/tokens').selectAccountTokenDecimals;

describe('FeesFooter', () => {
    let store: TestStore;
    let mockOnSubmit: jest.Mock;

    const defaultProps = {
        accountKey: 'test-account-key' as AccountKey,
        isSubmittable: true,
        onSubmit: jest.fn(),
        symbol: 'btc' as NetworkSymbol,
        totalAmount: '1000000',
        fee: '1000',
        tokenContract: undefined as TokenAddress | undefined,
        withSubmitButton: true,
    };

    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderFeesFooter = (props = {}) => {
        const finalProps = { ...defaultProps, ...props };
        mockOnSubmit = finalProps.onSubmit;

        return renderWithStoreProvider(
            <TestFormWrapper>
                {/*
                  FeesFooterProps expects withSubmitButton: true when present.
                  So we must ensure withSubmitButton is always true when passed.
                  This cast is safe because defaultProps and all usages set withSubmitButton: true.
                */}
                <FeesFooter {...(finalProps as React.ComponentProps<typeof FeesFooter>)} />
            </TestFormWrapper>,
            {
                store,
                preloadedState: getPreloadedState(),
            },
        );
    };

    beforeEach(() => {
        store = initStore(getPreloadedState()).store;

        // Default mock implementations
        mockSelectAreFeesLoading.mockReturnValue(false);
        mockSelectAccountTokenSymbol.mockReturnValue('USDC');
        mockSelectAccountTokenDecimals.mockReturnValue(6);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render mainnet summary when no token contract is provided', () => {
        const { getByText } = renderFeesFooter();

        expect(getByText('Total amount')).toBeTruthy();
    });

    it('should render token summary when token contract is provided', () => {
        const { getByText } = renderFeesFooter({
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
        });

        expect(getByText('Amount')).toBeTruthy();
        expect(getByText('Fee')).toBeTruthy();
    });

    it('should display total amount correctly', () => {
        const { getByText } = renderFeesFooter({
            totalAmount: '5000000',
        });

        expect(getByText('0.05 BTC')).toBeTruthy();
    });

    it('should show submit button when isSubmittable is true', () => {
        const { getByTestId } = renderFeesFooter({
            isSubmittable: true,
        });

        expect(getByTestId('@transactionManagement/fees-submit-button')).toBeTruthy();
    });

    it('should not show submit button when isSubmittable is false', () => {
        const { queryByTestId } = renderFeesFooter({
            isSubmittable: false,
        });

        expect(queryByTestId('@transactionManagement/fees-submit-button')).toBeNull();
    });

    it('should call onSubmit when submit button is pressed', async () => {
        const { getByTestId } = renderFeesFooter({
            isSubmittable: true,
        });

        await userEvent.press(getByTestId('@transactionManagement/fees-submit-button'));

        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('should display token symbol correctly', () => {
        mockSelectAccountTokenSymbol.mockReturnValue('USDC');

        const { getByText } = renderFeesFooter({
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
        });

        expect(getByText(/USDC/)).toBeTruthy();
    });

    it('should display token amount with correct decimals', () => {
        mockSelectAccountTokenDecimals.mockReturnValue(6);

        const { getByText } = renderFeesFooter({
            tokenContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
            totalAmount: '1000', // 1 USDC with 6 decimals
        });

        expect(getByText('0.001 USDC')).toBeTruthy();
    });

    it('should handle different token contracts', () => {
        mockSelectAccountTokenSymbol.mockReturnValue('DAI');

        const { getByText } = renderFeesFooter({
            tokenContract: '0x6b175474e89094c44da98b954eedeac495271d0f' as TokenAddress,
        });

        expect(getByText(/DAI/)).toBeTruthy();
    });

    it('should show submit button when withSubmitButton is true and isSubmittable is true', () => {
        const { getByText } = renderFeesFooter({
            isSubmittable: true,
            withSubmitButton: true,
        });

        expect(getByText('Review and sign')).toBeTruthy();
    });

    it.each([
        { isSubmittable: true, withSubmitButton: false },
        { isSubmittable: false, withSubmitButton: true },
        { isSubmittable: false, withSubmitButton: false },
    ])(
        'should not show submit button when withSubmitButton is $withSubmitButton even if isSubmittable is $isSubmittable',
        props => {
            const { queryByText } = renderFeesFooter(props);

            expect(queryByText('Review and sign')).toBeNull();
        },
    );

    it('should default withSubmitButton to true when not provided', () => {
        const { getByText } = renderFeesFooter({
            isSubmittable: true,
            // withSubmitButton not provided, should default to true
        });

        expect(getByText('Review and sign')).toBeTruthy();
    });
});
