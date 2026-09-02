import { Text } from '@suite-native/atoms';
import { act, fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import {
    ExchangeApprovalLimitCard,
    type ExchangeApprovalLimitCardProps,
} from './ExchangeApprovalLimitCard';

const mockOnChange = jest.fn();

describe('ExchangeApprovalLimitCard', () => {
    const renderExchangeApprovalLimitCard = async (
        props: Partial<ExchangeApprovalLimitCardProps>,
    ) => {
        const res = await renderWithBasicProvider(
            <ExchangeApprovalLimitCard
                title={<Text>Test limit</Text>}
                description="Test description"
                onChange={mockOnChange}
                {...props}
            />,
        );
        await act(async () => {
            await act(() => Promise.resolve());
        });

        return res;
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render title and description', async () => {
        const { getByText } = await renderExchangeApprovalLimitCard({});

        expect(getByText('Test limit')).toBeTruthy();
        expect(getByText('Test description')).toBeTruthy();
    });

    it('should render crypto icon when symbol is provided', async () => {
        const { getByLabelText } = await renderExchangeApprovalLimitCard({ symbol: 'btc' });

        expect(getByLabelText('btc')).toBeTruthy();
    });

    it('should render crypto icon with contract address when provided', async () => {
        const { getByLabelText } = await renderExchangeApprovalLimitCard({
            symbol: 'eth',
            contractAddress: '0x123456789',
        });

        expect(getByLabelText('eth:0x123456789')).toBeTruthy();
    });

    it('should call onChange when card is pressed', async () => {
        const { getByText } = await renderExchangeApprovalLimitCard({});

        await fireEvent.press(getByText('Test limit'));
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange when description is pressed', async () => {
        const { getByText } = await renderExchangeApprovalLimitCard({});

        await fireEvent.press(getByText('Test description'));
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should render children when provided', async () => {
        const { getByText } = await renderExchangeApprovalLimitCard({
            children: <Text>Test children</Text>,
        });

        expect(getByText('Test children')).toBeTruthy();
    });
});
