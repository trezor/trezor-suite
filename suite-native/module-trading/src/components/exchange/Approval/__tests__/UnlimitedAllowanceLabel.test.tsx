import type { CryptoId } from 'invity-api';

import { getTranslation } from '@suite-native/intl';
import { mercuryoFixedWorstQuote } from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { UnlimitedAllowanceLabel } from '../UnlimitedAllowanceLabel';

describe('UnlimitedAllowanceLabel', () => {
    const cryptoIdWithoutCoinInfo = 'ethereum--0xWithoutObjectInCoinsInfo' as CryptoId;

    const renderUnlimitedAllowanceLabel = (
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
        cryptoId: CryptoId = mercuryoFixedWorstQuote.send!,
    ) =>
        renderWithTradingProvider(<UnlimitedAllowanceLabel cryptoId={cryptoId} />, {
            tradeType: 'exchange',
            overrides,
        });

    it('should render unlimited label and coin symbol from trading info', () => {
        const unlimitedText = getTranslation(
            'moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel',
        );

        const { getByText } = renderUnlimitedAllowanceLabel();

        expect(getByText(new RegExp(`${unlimitedText}\\s*USDC`))).toBeOnTheScreen();
    });

    it('should render unlimited label without coin symbol when coin is missing in trading info', () => {
        const unlimitedText = getTranslation(
            'moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel',
        );

        const { getByText, queryByText } = renderUnlimitedAllowanceLabel(
            {},
            cryptoIdWithoutCoinInfo,
        );

        expect(queryByText('USDC')).toBeNull();
        expect(getByText(new RegExp(`^${unlimitedText}\\s*$`))).toBeOnTheScreen();
    });
});
