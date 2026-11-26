import { getTranslation } from '@suite-native/intl';
import { renderWithBasicProvider, screen } from '@suite-native/test-utils';
import { eth1NormalAccount } from '@suite-native/trading-fixtures';

import { type ExchangeFlowApprovalFeeSelectorRowProps } from './ExchangeFlowApprovalFeeSelectorRow';
import { ExchangeFlowApproveStepContent } from './ExchangeFlowApproveStepContent';

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

describe('ExchangeFlowApproveStepContent', () => {
    const renderContent = () =>
        renderWithBasicProvider(
            <ExchangeFlowApproveStepContent
                accountKey={eth1NormalAccount.key}
                coinSymbol="USDT"
                onApprovalTypeChange={jest.fn()}
            />,
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

    it('renders the limit and fee rows', async () => {
        await renderContent();

        expect(screen.queryByText('Original limit')).not.toBeOnTheScreen();
        expect(screen.getByText('Limit picker')).toBeOnTheScreen();
        expect(screen.getByText(`Fee row: ${eth1NormalAccount.key}`)).toBeOnTheScreen();
    });

    it('renders a divider above the fee row', async () => {
        await renderContent();

        expect(screen.getByTestId('@exchange-flow/approve/fee-divider')).toBeOnTheScreen();
    });
});
