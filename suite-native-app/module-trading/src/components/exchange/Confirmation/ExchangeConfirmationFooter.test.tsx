import { type TxKeyPath, getTranslation } from '@suite-native/intl';
import type { ConfirmingScreenFlowType } from '@suite-native/navigation';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import {
    EXCHANGE_CONFIRMATION_BUTTON_TEST_ID,
    ExchangeConfirmationFooter,
} from './ExchangeConfirmationFooter';

describe('ExchangeConfirmationFooter', () => {
    it.each<[ConfirmingScreenFlowType, TxKeyPath, TxKeyPath]>([
        [
            'approve',
            'moduleTrading.tradingConfirmationScreen.approveHint',
            'moduleTrading.tradingConfirmationScreen.approveTitle',
        ],
        [
            'revoke-and-approve',
            'moduleTrading.tradingConfirmationScreen.revokeAndApproveHint',
            'moduleTrading.tradingConfirmationScreen.revokeTitle',
        ],
        [
            'revoke',
            'moduleTrading.tradingConfirmationScreen.subtitle',
            'moduleTrading.tradingConfirmationScreen.revokeTitle',
        ],
    ])('renders the hint and the loading button for %s', async (flowType, hintId, buttonId) => {
        await renderWithBasicProvider(<ExchangeConfirmationFooter flowType={flowType} />);

        expect(screen.getByText(getTranslation(hintId))).toBeOnTheScreen();
        expect(screen.getByTestId(EXCHANGE_CONFIRMATION_BUTTON_TEST_ID)).toHaveTextContent(
            getTranslation(buttonId),
        );
        expect(
            screen.getByTestId(`${EXCHANGE_CONFIRMATION_BUTTON_TEST_ID}/loading`),
        ).toBeOnTheScreen();
    });
});
