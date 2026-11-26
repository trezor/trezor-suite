import { Text } from '@suite-native/atoms';
import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { ExchangeFlowIncreaseStepContent } from './ExchangeFlowIncreaseStepContent';

jest.mock('../Approval/OriginalLimit', () => {
    const { Text: MockText } = jest.requireActual('@suite-native/atoms');

    return { OriginalLimit: () => <MockText>Original limit</MockText> };
});

describe('ExchangeFlowIncreaseStepContent', () => {
    const renderContent = () =>
        renderWithBasicProvider(
            <ExchangeFlowIncreaseStepContent
                coinSymbol="USDT"
                limitRow={<Text>Limit row</Text>}
                feeRow={<Text>Fee row</Text>}
            >
                <Text>Extra row</Text>
            </ExchangeFlowIncreaseStepContent>,
        );

    it('renders the increase step title and description with the coin symbol', async () => {
        await renderContent();

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.increaseStep.title'),
            ),
        ).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.increaseStep.description', {
                    symbol: 'USDT',
                }),
            ),
        ).toBeOnTheScreen();
    });

    it('renders the limit, fee and extra rows', async () => {
        await renderContent();

        expect(screen.getByText('Original limit')).toBeOnTheScreen();
        expect(screen.getByText('Limit row')).toBeOnTheScreen();
        expect(screen.getByText('Fee row')).toBeOnTheScreen();
        expect(screen.getByText('Extra row')).toBeOnTheScreen();
    });

    it('renders a divider above the fee row', async () => {
        await renderContent();

        expect(screen.getByTestId('@exchange-flow/increase/fee-divider')).toBeOnTheScreen();
    });
});
