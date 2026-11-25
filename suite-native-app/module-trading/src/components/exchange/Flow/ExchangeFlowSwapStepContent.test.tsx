import { type Store } from '@reduxjs/toolkit';
import type { ExchangeTrade } from 'invity-api';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { tradingExchangeActions } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import { screen } from '@suite-native/test-utils-store';
import {
    eth1NormalAccount,
    mercuryoFixedWorstQuote,
    oneInchFusionPlusWithEip712SignDataQuote,
} from '@suite-native/trading-fixtures';
import { type TradingRootState } from '@suite-native/trading-state';

import { ExchangeFlowSwapStepContent } from './ExchangeFlowSwapStepContent';
import {
    createTradingTestStore,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';
import { type TradeFeeInfoRowProps } from '../../general/TradeInfo/TradeFeeInfoRow';

jest.mock('../../general/TradeInfo/TradeFeeInfoRow', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return {
        TradeFeeInfoRow: ({ baseValueOnly }: TradeFeeInfoRowProps) => (
            <Text>{`Fee row: base value only ${baseValueOnly}`}</Text>
        ),
    };
});

jest.mock('../ExchangePreview/ExchangeSlippagePicker', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return { ExchangeSlippagePicker: () => <Text>Slippage picker</Text> };
});

jest.mock('../ExchangePreview/ExchangePreviewSimulationInfo', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return { ExchangePreviewSimulationInfo: () => <Text>Simulation info</Text> };
});

jest.mock('../ExchangePreview/ExchangePreviewIssueBanner', () => {
    const { Text } = jest.requireActual('@suite-native/atoms');

    return { ExchangePreviewIssueBanner: () => <Text>Issue banner</Text> };
});

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn() }),
}));

const PAY_ROW_TEST_ID = '@trading/history/detail/info/pay';
const GET_ROW_TEST_ID = '@trading/history/detail/info/get';
const FEE_ROW_TEXT = 'Fee row: base value only true';

describe('ExchangeFlowSwapStepContent', () => {
    let store: Store<TradingRootState>;

    const renderContent = ({
        quote = mercuryoFixedWorstQuote,
        txnErrorString = null,
    }: {
        quote?: ExchangeTrade;
        txnErrorString?: string | null;
    } = {}) =>
        renderWithTradingProvider(
            <ExchangeFlowSwapStepContent
                quote={quote}
                txnErrorString={txnErrorString}
                onSignTransactionNavigation={jest.fn()}
                onSlippageConfirmed={jest.fn()}
            />,
            { services: { store, networks: mockNetworksServices() }, tradeType: 'exchange' },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        store = createTradingTestStore({ tradeType: 'exchange' });
        store.dispatch(tradingExchangeActions.saveSelectedQuote(mercuryoFixedWorstQuote));
        store.dispatch(tradingExchangeActions.setTradingAccountKey(eth1NormalAccount.key));
    });

    it('renders the review header with the simulation info', async () => {
        await renderContent();

        expect(
            screen.getByText(
                getTranslation('moduleTrading.tradingExchangeFlowScreen.swapStep.title'),
            ),
        ).toBeOnTheScreen();
        expect(screen.getByText('Simulation info')).toBeOnTheScreen();
    });

    it('renders the pay, get, provider, simplified fee and slippage rows', async () => {
        await renderContent();

        expect(screen.getByTestId(PAY_ROW_TEST_ID)).toHaveTextContent(
            getTranslation('moduleTrading.tradeHistory.detail.info.youPayLabel'),
            { exact: false },
        );
        expect(screen.getByTestId(GET_ROW_TEST_ID)).toHaveTextContent(
            getTranslation('moduleTrading.tradeHistory.detail.info.youGet'),
            { exact: false },
        );
        expect(screen.getByText('Mercuryo')).toBeOnTheScreen();
        expect(screen.getByText(FEE_ROW_TEXT)).toBeOnTheScreen();
        expect(screen.getByText('Slippage picker')).toBeOnTheScreen();
        expect(screen.getByText('Issue banner')).toBeOnTheScreen();
    });

    it('leaves a transaction error to the fee row', async () => {
        await renderContent({ txnErrorString: 'Insufficient funds' });

        expect(screen.queryByText('Insufficient funds')).not.toBeOnTheScreen();
        expect(screen.queryByText('Issue banner')).not.toBeOnTheScreen();
    });

    it('renders no fee row and shows the error for an EIP-712 order', async () => {
        await renderContent({
            quote: oneInchFusionPlusWithEip712SignDataQuote,
            txnErrorString: 'Signing failed',
        });

        expect(screen.queryByText(FEE_ROW_TEXT)).not.toBeOnTheScreen();
        expect(screen.getByText('Signing failed')).toBeOnTheScreen();
    });
});
