import { yup } from '@suite-common/validators';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FormState } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Form, useForm } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { FeesContent, type FeesContentProps } from './FeesContent';
import { createFeeLevels } from '../../__fixtures__/feeLevels';
import { getWalletState } from '../../__fixtures__/walletState';

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

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
    const accountKey = mockAccountKey({ symbol: btcSymbol, descriptor: 'btc1' });
    const mockOnSelectedFeeLevel = jest.fn();
    const mockOnCustomFeeSet = jest.fn();

    const createMockFeeLevels = () =>
        createFeeLevels({
            economy: { totalSpent: '100000', feePerByte: '4', fee: '1000' },
            normal: { totalSpent: '100000', feePerByte: '10', fee: '2000' },
            high: { totalSpent: '100000', feePerByte: '30', fee: '3000' },
        });

    const defaultProps: FeesContentProps = {
        selectedFeeLevel: 'normal',
        feeLevels: createMockFeeLevels(),
        symbol: btcSymbol,
        networkType: 'bitcoin',
        accountKey,
        areFeesLoading: false,
        onSelectedFeeLevel: mockOnSelectedFeeLevel,
        onCustomFeeSet: mockOnCustomFeeSet,
        formDraft: null,
    };

    const getPreloadedState = () => ({
        wallet: getWalletState(),
    });

    const renderFeesContent = async (props: Partial<FeesContentProps> = {}) => {
        const finalProps = { ...defaultProps, ...props };

        return await renderWithStoreProvider(
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

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeTruthy();
        expect(
            getByText(getTranslation('transactionManagement.fees.description.body')),
        ).toBeTruthy();
    });

    it('should render fee options list when selected fee level is not custom', async () => {
        const { getByTestId } = await renderFeesContent({
            selectedFeeLevel: 'normal',
        });

        expect(getByTestId('@transactionManagement/fees-level-container-normal')).toBeTruthy();
    });

    it('should not render fee options list when selected fee level is custom', async () => {
        const { queryByTestId } = await renderFeesContent({
            selectedFeeLevel: 'custom',
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
            symbol: ethSymbol,
        });

        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeTruthy();
    });

    it('should render with form draft data', async () => {
        const mockFormDraft = {
            selectedFee: 'high',
            feePerUnit: '10',
        } as FormState;

        const { getByTestId } = await renderFeesContent({
            selectedFeeLevel: 'high',
            formDraft: mockFormDraft,
        });

        expect(getByTestId('@transactionManagement/fees-level-container-high')).toBeTruthy();
    });
});
