import { yup } from '@suite-common/validators';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Form, useForm } from '@suite-native/forms';
import { userEvent } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { TestStore, initStore, renderWithStoreProvider } from '@suite-native/test-utils/store';

import { getWalletState } from '../../../../__fixtures__/walletState';
import { NativeSupportedPredefinedFeeLevel } from '../../../../types';
import { FeeOption } from '../FeeOption';

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

describe('FeeOption', () => {
    let store: TestStore;
    let mockOnSelectedFeeLevel: jest.Mock;

    const createMockFeeLevel = () =>
        ({
            type: 'final',
            totalSpent: '100000',
            fee: '1000',
            feePerByte: '10',
            bytes: 250,
            feeLimit: '21000',
            outputs: [
                {
                    address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                    amount: '50000',
                    script_type: 'PAYTOADDRESS',
                },
            ],
            inputs: [
                {
                    script_type: 'SPENDWITNESS',
                    sequence: 0xffffffff,
                    prev_hash: '0000000000000000000000000000000000000000000000000000000000000000',
                    prev_index: 0,
                    amount: '100000',
                    address_n: [44, 0, 0, 0, 0],
                },
            ],
        }) as any;

    const defaultProps = {
        feeKey: 'normal' as NativeSupportedPredefinedFeeLevel,
        feeLevel: createMockFeeLevel(),
        symbol: 'btc' as NetworkSymbol,
        transactionBytes: 250,
        isInteractive: true,
        isLoading: false,
        onSelectedFeeLevel: jest.fn(),
    };

    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderFeeOption = (props = {}) => {
        const finalProps = { ...defaultProps, ...props };
        mockOnSelectedFeeLevel = finalProps.onSelectedFeeLevel;

        return renderWithStoreProvider(
            <TestFormWrapper>
                <FeeOption {...finalProps} />
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
        mockSelectConvertedNetworkFeeLevelTimeEstimate.mockReturnValue('~10 minutes');
        mockSelectConvertedNetworkFeeLevelFeePerUnit.mockReturnValue('10');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it.each([
            ['normal', /Normal/],
            ['economy', /Low/],
            ['high', /High/],
        ])('should render %s fee level with correct label', (feeKey, expectedLabel) => {
            const { getByText } = renderFeeOption({ feeKey });

            expect(getByText(expectedLabel)).toBeTruthy();
        });

        it('should display fee information correctly', () => {
            const { getByText } = renderFeeOption();

            expect(getByText('4 sat/vB')).toBeTruthy();
            expect(getByText('~ ~10 minutes')).toBeTruthy();
        });

        it('should show radio button when interactive', () => {
            const { getByTestId } = renderFeeOption();

            expect(getByTestId('@transactionManagement/fees-level-radio-normal')).toBeTruthy();
        });

        it('should not show radio button when not interactive', () => {
            const { queryByTestId } = renderFeeOption({
                isInteractive: false,
            });

            expect(queryByTestId('@transactionManagement/fees-level-radio-normal')).toBeNull();
        });

        it('should show loading skeleton when isLoading is true', () => {
            const { queryAllByTestId } = renderFeeOption({
                isLoading: true,
            });

            expect(queryAllByTestId('BoxSkeleton').length).toBeTruthy();
        });
    });

    describe('Interaction', () => {
        it('should call onSelectedFeeLevel when pressed', async () => {
            const { getByTestId } = renderFeeOption();

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-normal'));

            expect(mockOnSelectedFeeLevel).toHaveBeenCalledWith('normal');
        });

        it('should not call onSelectedFeeLevel when not interactive', async () => {
            const { getByTestId } = renderFeeOption({
                isInteractive: false,
            });

            await userEvent.press(
                getByTestId('@transactionManagement/fees-level-container-normal'),
            );

            expect(mockOnSelectedFeeLevel).not.toHaveBeenCalled();
        });

        it('should handle different fee levels correctly', async () => {
            const { getByTestId } = renderFeeOption({
                feeKey: 'economy',
            });

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-economy'));

            expect(mockOnSelectedFeeLevel).toHaveBeenCalledWith('economy');
        });
    });

    describe('Fee calculation', () => {
        it('should calculate fee per unit correctly for bitcoin', () => {
            const { getByText } = renderFeeOption({
                symbol: 'btc',
                feeLevel: createMockFeeLevel(),
                transactionBytes: 250,
            });

            // For bitcoin: fee / bytes = 1000 / 250 = 4 sat/vB
            expect(getByText('4 sat/vB')).toBeTruthy();
        });

        it('should use feePerByte for non-bitcoin networks', () => {
            const { getByText } = renderFeeOption({
                symbol: 'eth',
                feeLevel: createMockFeeLevel(),
                transactionBytes: 250,
            });

            expect(getByText('10.0000 Gwei')).toBeTruthy();
        });
    });
});
