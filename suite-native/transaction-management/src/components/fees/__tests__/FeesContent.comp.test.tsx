import { yup } from '@suite-common/validators';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, FormState } from '@suite-common/wallet-types';
import { Form, useForm } from '@suite-native/forms';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { getWalletState } from '../../../__fixtures__/walletState';
import { NativeSupportedFeeLevel } from '../../../types/fees';
import { FeesContent } from '../FeesContent';

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

describe('FeesContent', () => {
    const mockAccountKey: AccountKey = 'btc1';
    const mockOnSelectedFeeLevel = jest.fn();
    const mockOnCustomFeeSet = jest.fn();

    const createMockFeeLevel = () =>
        ({
            type: 'final',
            totalSpent: '100000',
            fee: '1000',
            feePerByte: '10',
            bytes: 250,
        }) as any;

    const createMockFeeLevels = () => ({
        economy: { ...createMockFeeLevel(), feePerByte: '4', fee: '1000', bytes: 250 },
        normal: { ...createMockFeeLevel(), feePerByte: '10', fee: '2000', bytes: 250 },
        high: { ...createMockFeeLevel(), feePerByte: '30', fee: '3000', bytes: 250 },
    });

    const defaultProps = {
        selectedFeeLevel: 'normal' as NativeSupportedFeeLevel,
        feeLevels: createMockFeeLevels(),
        symbol: 'btc' as NetworkSymbol,
        accountKey: mockAccountKey,
        areFeesLoading: false,
        onSelectedFeeLevel: mockOnSelectedFeeLevel,
        onCustomFeeSet: mockOnCustomFeeSet,
        formDraft: null as FormState | null,
    };

    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderFeesContent = (props = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithStoreProviderAsync(
            <TestFormWrapper>
                <FeesContent {...finalProps} />
            </TestFormWrapper>,
            {
                preloadedState: getPreloadedState(),
            },
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render title and description', async () => {
        const { getByText } = await renderFeesContent();

        expect(getByText('Transaction fee')).toBeTruthy();
        expect(
            getByText('Fees are paid directly to validators for processing your transactions.'),
        ).toBeTruthy();
    });

    it('should render fee options list when selected fee level is not custom', async () => {
        const { getByTestId } = await renderFeesContent({
            selectedFeeLevel: 'normal' as NativeSupportedFeeLevel,
        });

        expect(getByTestId('@transactionManagement/fees-level-container-normal')).toBeTruthy();
    });

    it('should not render fee options list when selected fee level is custom', async () => {
        const { queryByTestId } = await renderFeesContent({
            selectedFeeLevel: 'custom' as NativeSupportedFeeLevel,
        });

        expect(queryByTestId('@transactionManagement/fees-level-container-normal')).toBeNull();
    });

    it('should always render custom fee component', async () => {
        const { getByTestId } = await renderFeesContent();

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should render all three fee level options', async () => {
        const { getByTestId } = await renderFeesContent();

        expect(getByTestId('@transactionManagement/fees-level-container-economy')).toBeTruthy();
        expect(getByTestId('@transactionManagement/fees-level-container-normal')).toBeTruthy();
        expect(getByTestId('@transactionManagement/fees-level-container-high')).toBeTruthy();
    });

    it('should handle loading state', async () => {
        const { getByTestId } = await renderFeesContent({
            areFeesLoading: true,
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should work with different network symbols', async () => {
        const { getByText } = await renderFeesContent({
            symbol: 'eth' as NetworkSymbol,
        });

        expect(getByText('Transaction fee')).toBeTruthy();
    });

    it('should render with form draft data', async () => {
        const mockFormDraft = {
            selectedFee: 'high' as NativeSupportedFeeLevel,
            feePerUnit: '10',
        } as FormState;

        const { getByTestId } = await renderFeesContent({
            selectedFeeLevel: 'high' as NativeSupportedFeeLevel,
            formDraft: mockFormDraft,
        });

        expect(getByTestId('@transactionManagement/fees-level-container-high')).toBeTruthy();
    });
});
