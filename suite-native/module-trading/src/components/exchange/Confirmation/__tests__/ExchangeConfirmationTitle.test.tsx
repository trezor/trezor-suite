import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import {
    ExchangeConfirmationTitle,
    type ExchangeConfirmationTitleProps,
} from '../ExchangeConfirmationTitle';

describe('ExchangeConfirmationTitle', () => {
    const renderTitle = (props: ExchangeConfirmationTitleProps) =>
        renderWithBasicProvider(<ExchangeConfirmationTitle {...props} />);

    it('should display approve title when variant is approve', () => {
        renderTitle({ variant: 'approve' });

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingConfirmationScreen.approveTitle'),
            ),
        ).toBeOnTheScreen();
    });

    it('should display revoke title when variant is revoke', () => {
        renderTitle({ variant: 'revoke' });

        expect(
            screen.getByText(getTranslation('moduleTrading.tradingConfirmationScreen.revokeTitle')),
        ).toBeOnTheScreen();
    });

    it('should display subtitle', () => {
        renderTitle({ variant: 'approve' });

        expect(
            screen.getByText(getTranslation('moduleTrading.tradingConfirmationScreen.subtitle')),
        ).toBeOnTheScreen();
    });
});
