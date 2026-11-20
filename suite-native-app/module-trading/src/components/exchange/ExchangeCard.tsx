import { Translation } from '@suite-native/intl';
import { type NativeSpacing } from '@trezor/theme';

import { ExchangeAssetsSwitchDivider } from './ExchangeAssetsSwitchDivider';
import { ExchangeReceiveContent } from './receive/ExchangeReceiveContent';
import { ExchangeSendAmountErrorBadge } from './send/ExchangeSendAmountErrorBadge';
import { ExchangeSendContent } from './send/ExchangeSendContent';
import { TradingCard } from '../general/TradingCard';
import { TradingCardSection } from '../general/TradingCardSection';

type ExchangeCardProps = {
    isAmountInputActive: boolean;
};

const EXCHANGE_CARD_TEST_ID = '@trading/exchangeCard';

export const EXCHANGE_SEND_SECTION_BOTTOM_SPACING: NativeSpacing = 'sp20';

export const ExchangeCard = ({ isAmountInputActive }: ExchangeCardProps) => (
    <TradingCard isAmountInputActive={isAmountInputActive}>
        <TradingCardSection
            bottomSpacing={EXCHANGE_SEND_SECTION_BOTTOM_SPACING}
            testID={`${EXCHANGE_CARD_TEST_ID}/sendSection`}
            title={<Translation id="moduleTrading.selectCoinToSell.title" />}
            titleAction={<ExchangeSendAmountErrorBadge />}
        >
            <ExchangeSendContent />
        </TradingCardSection>
        <ExchangeAssetsSwitchDivider />
        <TradingCardSection
            testID={`${EXCHANGE_CARD_TEST_ID}/receiveSection`}
            title={<Translation id="moduleTrading.selectCoin.title" />}
        >
            <ExchangeReceiveContent />
        </TradingCardSection>
    </TradingCard>
);
