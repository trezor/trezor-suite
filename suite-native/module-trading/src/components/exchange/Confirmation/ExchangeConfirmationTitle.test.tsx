import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider } from '@suite-native/test-utils';

import {
    ExchangeConfirmationTitle,
    type ExchangeConfirmationTitleProps,
} from './ExchangeConfirmationTitle';

describe('ExchangeConfirmationTitle', () => {
    const renderTitle = async (props: ExchangeConfirmationTitleProps) =>
        await renderWithBasicProvider(<ExchangeConfirmationTitle {...props} />);

    it('should display approve title when flowType is approve', async () => {
        const { getByText } = await renderTitle({
            flowType: 'approve',
            isFailed: false,
            isPending: true,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.approveTitle')),
        ).toBeOnTheScreen();
    });

    it('should display revoke title when flowType is revoke', async () => {
        const { getByText } = await renderTitle({
            flowType: 'revoke',
            isFailed: false,
            isPending: true,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.revokeTitle')),
        ).toBeOnTheScreen();
    });

    it('should display revoke title when flowType is revoke-and-approve', async () => {
        const { getByText } = await renderTitle({
            flowType: 'revoke-and-approve',
            isFailed: false,
            isPending: true,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.revokeTitle')),
        ).toBeOnTheScreen();
    });

    it('should display subtitle', async () => {
        const { getByText } = await renderTitle({
            flowType: 'approve',
            isFailed: false,
            isPending: true,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.subtitle')),
        ).toBeOnTheScreen();
    });

    it('should display pending badge when isPending', async () => {
        const { getByText } = await renderTitle({
            flowType: 'approve',
            isFailed: false,
            isPending: true,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.pending')),
        ).toBeOnTheScreen();
    });

    it('should not display pending badge when isPending is false', async () => {
        const { queryByText } = await renderTitle({
            flowType: 'approve',
            isFailed: false,
            isPending: false,
        });

        expect(
            queryByText(getTranslation('moduleTrading.tradingConfirmationScreen.pending')),
        ).not.toBeOnTheScreen();
    });

    it('should display error alert when isFailed', async () => {
        const { getByText } = await renderTitle({
            flowType: 'approve',
            isFailed: true,
            isPending: false,
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingConfirmationScreen.error')),
        ).toBeOnTheScreen();
    });

    it('should not display pending alert when isFailed is false', async () => {
        const { queryByText } = await renderTitle({
            flowType: 'approve',
            isFailed: false,
            isPending: false,
        });

        expect(
            queryByText(getTranslation('moduleTrading.tradingConfirmationScreen.error')),
        ).not.toBeOnTheScreen();
    });
});
