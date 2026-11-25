import { type TradingExchangeType } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { mercuryoDexQuote } from '@suite-native/trading-fixtures';

import { TradeFeeInfoRow, type TradeFeeInfoRowProps } from './TradeFeeInfoRow';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const btc1AccountKey = mockAccountKey({ symbol: asNetworkSymbol('btc'), descriptor: 'btc1' });

const mockFeeSelectorProps = jest.fn();
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    FeeSelectorRow: jest.fn(props => {
        mockFeeSelectorProps(props);

        return null;
    }),
}));

describe('TradeFeeInfoRow', () => {
    const renderTradeFeeInfoRow = (props: Partial<TradeFeeInfoRowProps> = {}) =>
        renderWithTradingProvider(
            <TradeFeeInfoRow
                trade={mercuryoDexQuote}
                accountKey={btc1AccountKey}
                tradingType={'exchange' as TradingExchangeType}
                {...props}
            />,
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the full fee row by default', async () => {
        await renderTradeFeeInfoRow();

        expect(mockFeeSelectorProps).toHaveBeenCalledWith(
            expect.objectContaining({
                accountKey: btc1AccountKey,
                baseValueOnly: false,
                onFeeConfirmed: expect.any(Function),
            }),
        );
    });

    it('renders the simplified fee row with baseValueOnly', async () => {
        await renderTradeFeeInfoRow({ baseValueOnly: true });

        expect(mockFeeSelectorProps).toHaveBeenCalledWith(
            expect.objectContaining({ baseValueOnly: true }),
        );
    });
});
