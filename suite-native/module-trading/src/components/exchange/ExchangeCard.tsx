import { Translation } from '@suite-native/intl';

import { ExchangeReceiveContent } from './receive/ExchangeReceiveContent';
import { ExchangeSendAmountErrorBadge } from './send/ExchangeSendAmountErrorBadge';
import { ExchangeSendContent } from './send/ExchangeSendContent';
import { TradingCard } from '../general/TradingCard';
import { TradingCardSection } from '../general/TradingCardSection';

type ExchangeCardProps = {
    isAmountInputActive: boolean;
};

const EXCHANGE_CARD_TEST_ID = '@trading/exchangeCard';

export const ExchangeCard = ({ isAmountInputActive }: ExchangeCardProps) => (
    <TradingCard isAmountInputActive={isAmountInputActive}>
        <TradingCardSection
            bottomBorder
            testID={`${EXCHANGE_CARD_TEST_ID}/sendSection`}
            title={<Translation id="moduleTrading.selectCoinToSell.title" />}
            titleAction={<ExchangeSendAmountErrorBadge />}
        >
            <ExchangeSendContent />
        </TradingCardSection>
        <TradingCardSection
            readOnly
            testID={`${EXCHANGE_CARD_TEST_ID}/receiveSection`}
            title={<Translation id="moduleTrading.selectCoin.title" />}
        >
            <ExchangeReceiveContent />
        </TradingCardSection>
    </TradingCard>
);
