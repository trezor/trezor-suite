import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { ExchangeApprovalLimitCard } from '../ExchangeApprovalLimitCard';

const mockOnChange = jest.fn();

const defaultProps = {
    title: 'Test limit',
    description: 'Test description',
    onChange: mockOnChange,
};

describe('ExchangeApprovalLimitCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render title and description', () => {
        const { getByText } = renderWithBasicProvider(
            <ExchangeApprovalLimitCard {...defaultProps} />,
        );

        expect(getByText('Test limit')).toBeTruthy();
        expect(getByText('Test description')).toBeTruthy();
    });

    it('should render crypto icon when symbol is provided', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <ExchangeApprovalLimitCard {...defaultProps} symbol="btc" />,
        );

        expect(getByLabelText('btc')).toBeTruthy();
    });

    it('should render crypto icon with contract address when provided', () => {
        const { getByLabelText } = renderWithBasicProvider(
            <ExchangeApprovalLimitCard
                {...defaultProps}
                symbol="eth"
                contractAddress="0x123456789"
            />,
        );

        expect(getByLabelText('eth0x123456789')).toBeTruthy();
    });

    it('should call onChange when card is pressed', () => {
        const { getByText } = renderWithBasicProvider(
            <ExchangeApprovalLimitCard {...defaultProps} />,
        );

        fireEvent.press(getByText('Test limit'));
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange when description is pressed', () => {
        const { getByText } = renderWithBasicProvider(
            <ExchangeApprovalLimitCard {...defaultProps} />,
        );

        fireEvent.press(getByText('Test description'));
        expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
});
