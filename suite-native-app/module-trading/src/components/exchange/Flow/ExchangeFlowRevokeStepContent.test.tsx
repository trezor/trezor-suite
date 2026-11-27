import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { ExchangeFlowRevokeStepContent } from './ExchangeFlowRevokeStepContent';

jest.mock('../Approval/RevokeLimitInfoRow', () => {
    const { Text: MockText } = jest.requireActual('@suite-native/atoms');

    return { RevokeLimitInfoRow: () => <MockText>Revoke limit row</MockText> };
});

describe('ExchangeFlowRevokeStepContent', () => {
    const renderContent = () =>
        renderWithBasicProvider(
            <ExchangeFlowRevokeStepContent coinSymbol="USDT" feeRow={<Text>Fee row</Text>}>
                <Text>Extra row</Text>
            </ExchangeFlowRevokeStepContent>,
        );

    it('renders the revoke step title and description with the coin symbol', async () => {
        await renderContent();

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.revokeStep.title'),
            ),
        ).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.revokeStep.description', {
                    symbol: 'USDT',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('renders the revoke limit, fee and extra rows', async () => {
        await renderContent();

        expect(screen.getByText('Revoke limit row')).toBeOnTheScreen();
        expect(screen.getByText('Fee row')).toBeOnTheScreen();
        expect(screen.getByText('Extra row')).toBeOnTheScreen();
    });
});
