import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { ExchangeFlowApproveStepContent } from './ExchangeFlowApproveStepContent';

jest.mock('../Approval/OriginalLimit', () => {
    const { Text: MockText } = jest.requireActual('@suite-native/atoms');

    return { OriginalLimit: () => <MockText>Original limit</MockText> };
});

describe('ExchangeFlowApproveStepContent', () => {
    const renderContent = () =>
        renderWithBasicProvider(
            <ExchangeFlowApproveStepContent
                coinSymbol="USDT"
                limitRow={<Text>Limit row</Text>}
                feeRow={<Text>Fee row</Text>}
            >
                <Text>Extra row</Text>
            </ExchangeFlowApproveStepContent>,
        );

    it('renders the approve step title and description with the coin symbol', async () => {
        await renderContent();

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.approveStep.title'),
            ),
        ).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.approveStep.description', {
                    symbol: 'USDT',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('renders the limit, fee and extra rows', async () => {
        await renderContent();

        expect(screen.queryByText('Original limit')).not.toBeOnTheScreen();
        expect(screen.getByText('Limit row')).toBeOnTheScreen();
        expect(screen.getByText('Fee row')).toBeOnTheScreen();
        expect(screen.getByText('Extra row')).toBeOnTheScreen();
    });

    it('renders a divider above the fee row', async () => {
        await renderContent();

        expect(screen.getByTestId('@exchange-flow/approve/fee-divider')).toBeOnTheScreen();
    });
});
