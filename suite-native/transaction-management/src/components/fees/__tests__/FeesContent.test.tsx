import { yup } from '@suite-common/validators';
import { AccountKey, FormState } from '@suite-common/wallet-types';
import { Form, useForm } from '@suite-native/forms';
import { renderWithStoreProvider } from '@suite-native/test-utils/store';

import { getWalletState } from '../../../__fixtures__/walletState';
import { FeesContent, FeesContentProps } from '../FeesContent';

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
    const mockAccountKey: AccountKey = 'btc1' as AccountKey; // Todo: create properly via `createAccountKey()`
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

    const defaultProps: FeesContentProps = {
        selectedFeeLevel: 'normal',
        feeLevels: createMockFeeLevels(),
        symbol: 'btc',
        networkType: 'bitcoin',
        accountKey: mockAccountKey,
        areFeesLoading: false,
        onSelectedFeeLevel: mockOnSelectedFeeLevel,
        onCustomFeeSet: mockOnCustomFeeSet,
        formDraft: null,
    };

    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderFeesContent = (props: Partial<FeesContentProps> = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithStoreProvider(
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

    it('should render title and description', () => {
        const { getByText } = renderFeesContent();

        expect(getByText('Transaction fee')).toBeTruthy();
        expect(
            getByText('Fees are paid directly to validators for processing your transactions.'),
        ).toBeTruthy();
    });

    it('should render fee options list when selected fee level is not custom', () => {
        const { getByTestId } = renderFeesContent({
            selectedFeeLevel: 'normal',
        });

        expect(getByTestId('@transactionManagement/fees-level-container-normal')).toBeTruthy();
    });

    it('should not render fee options list when selected fee level is custom', () => {
        const { queryByTestId } = renderFeesContent({
            selectedFeeLevel: 'custom',
        });

        expect(queryByTestId('@transactionManagement/fees-level-container-normal')).toBeNull();
    });

    it('should always render custom fee component', () => {
        const { getByTestId } = renderFeesContent();

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should render all three fee level options', () => {
        const { getByTestId } = renderFeesContent();

        expect(getByTestId('@transactionManagement/fees-level-container-economy')).toBeTruthy();
        expect(getByTestId('@transactionManagement/fees-level-container-normal')).toBeTruthy();
        expect(getByTestId('@transactionManagement/fees-level-container-high')).toBeTruthy();
    });

    it('should handle loading state', () => {
        const { getByTestId } = renderFeesContent({
            areFeesLoading: true,
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should work with different network symbols', () => {
        const { getByText } = renderFeesContent({
            symbol: 'eth',
        });

        expect(getByText('Transaction fee')).toBeTruthy();
    });

    it('should render with form draft data', () => {
        const mockFormDraft = {
            selectedFee: 'high',
            feePerUnit: '10',
        } as FormState;

        const { getByTestId } = renderFeesContent({
            selectedFeeLevel: 'high',
            formDraft: mockFormDraft,
        });

        expect(getByTestId('@transactionManagement/fees-level-container-high')).toBeTruthy();
    });
});
