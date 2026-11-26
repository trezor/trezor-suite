import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';
import { eth1NormalAccount } from '@suite-native/trading-fixtures';

import { type ExchangeFlowApprovalFeeSelectorRowProps } from './ExchangeFlowApprovalFeeSelectorRow';
import { ExchangeFlowIncreaseStepContent } from './ExchangeFlowIncreaseStepContent';

jest.mock('../Approval/LimitPicker', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return { LimitPicker: () => <Text>Limit picker</Text> };
});

jest.mock('../Approval/OriginalLimit', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return { OriginalLimit: () => <Text>Original limit</Text> };
});

jest.mock('./ExchangeFlowApprovalFeeSelectorRow', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return {
        ExchangeFlowApprovalFeeSelectorRow: ({
            accountKey,
        }: ExchangeFlowApprovalFeeSelectorRowProps) => <Text>{`Fee row: ${accountKey}`}</Text>,
    };
});

describe('ExchangeFlowIncreaseStepContent', () => {
    const renderContent = () =>
        renderWithBasicProvider(
            <ExchangeFlowIncreaseStepContent
                accountKey={eth1NormalAccount.key}
                coinSymbol="USDT"
                onApprovalTypeChange={jest.fn()}
            />,
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

    it('renders the limit and fee rows', async () => {
        await renderContent();

        expect(screen.getByText('Original limit')).toBeOnTheScreen();
        expect(screen.getByText('Limit picker')).toBeOnTheScreen();
        expect(screen.getByText(`Fee row: ${eth1NormalAccount.key}`)).toBeOnTheScreen();
    });

    it('renders a divider above the fee row', async () => {
        await renderContent();

        expect(screen.getByTestId('@exchange-flow/increase/fee-divider')).toBeOnTheScreen();
    });
});
