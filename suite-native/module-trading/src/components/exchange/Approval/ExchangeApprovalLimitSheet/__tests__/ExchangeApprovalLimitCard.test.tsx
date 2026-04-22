import { Text } from '@suite-native/atoms';
import { fireEvent, renderWithProviders } from '@suite-native/test-utils';

import {
    ExchangeApprovalLimitCard,
    type ExchangeApprovalLimitCardProps,
} from '../ExchangeApprovalLimitCard';

const mockOnChange = jest.fn();

describe('ExchangeApprovalLimitCard', () => {
    const renderExchangeApprovalLimitCard = (props: Partial<ExchangeApprovalLimitCardProps>) =>
        renderWithProviders(
            <ExchangeApprovalLimitCard
                title={<Text>Test limit</Text>}
                description="Test description"
                onChange={mockOnChange}
                {...props}
            />,
            { providers: ['intl'] },
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render title and description', () => {
        const { getByText } = renderExchangeApprovalLimitCard({});

        expect(getByText('Test limit')).toBeTruthy();
        expect(getByText('Test description')).toBeTruthy();
    });

    it('should render crypto icon when symbol is provided', () => {
        const { getByLabelText } = renderExchangeApprovalLimitCard({ symbol: 'btc' });

        expect(getByLabelText('btc')).toBeTruthy();
    });

    it('should render crypto icon with contract address when provided', () => {
        const { getByLabelText } = renderExchangeApprovalLimitCard({
            symbol: 'eth',
            contractAddress: '0x123456789',
        });

        expect(getByLabelText('eth0x123456789')).toBeTruthy();
    });

    it('should call onChange when card is pressed', () => {
        const { getByText } = renderExchangeApprovalLimitCard({});

        fireEvent.press(getByText('Test limit'));
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange when description is pressed', () => {
        const { getByText } = renderExchangeApprovalLimitCard({});

        fireEvent.press(getByText('Test description'));
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should render children when provided', () => {
        const { getByText } = renderExchangeApprovalLimitCard({
            children: <Text>Test children</Text>,
        });

        expect(getByText('Test children')).toBeTruthy();
    });
});
