import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import {
    ExchangeConfirmationTitle,
    type ExchangeConfirmationTitleProps,
} from '../ExchangeConfirmationTitle';

describe('ExchangeConfirmationTitle', () => {
    const renderTitle = (props: ExchangeConfirmationTitleProps) =>
        renderWithBasicProvider(<ExchangeConfirmationTitle {...props} />);

    it('should display approve title when variant is approve', () => {
        const { getByText } = renderTitle({ variant: 'approve', isFailed: false, isPending: true });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.approveTitle')),
        ).toBeOnTheScreen();
    });

    it('should display revoke title when variant is revoke', () => {
        const { getByText } = renderTitle({ variant: 'revoke', isFailed: false, isPending: true });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.revokeTitle')),
        ).toBeOnTheScreen();
    });

    it('should display subtitle', () => {
        const { getByText } = renderTitle({ variant: 'approve', isFailed: false, isPending: true });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.subtitle')),
        ).toBeOnTheScreen();
    });

    it('should display pending badge when isPending', () => {
        const { getByText } = renderTitle({ variant: 'approve', isFailed: false, isPending: true });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.pending')),
        ).toBeOnTheScreen();
    });

    it('should not display pending badge when isPending is false', () => {
        const { queryByText } = renderTitle({
            variant: 'approve',
            isFailed: false,
            isPending: false,
        });

        expect(
            queryByText(getTranslation('moduleTrading.tradingConfirmationScreen.pending')),
        ).not.toBeOnTheScreen();
    });

    it('should display pending badge when isFailed', () => {
        const { getByText } = renderTitle({ variant: 'approve', isFailed: true, isPending: false });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.error')),
        ).toBeOnTheScreen();
    });

    it('should not display pending badge when isFailed is false', () => {
        const { queryByText } = renderTitle({
            variant: 'approve',
            isFailed: false,
            isPending: false,
        });

        expect(
            queryByText(getTranslation('moduleTrading.tradingConfirmationScreen.error')),
        ).not.toBeOnTheScreen();
    });
});
