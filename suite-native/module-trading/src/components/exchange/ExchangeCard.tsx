import { useWatch } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import { CryptoToFiatValueBadge } from '@suite-native/trading-quote-utils';

import { ExchangeReceiveContent } from './receive/ExchangeReceiveContent';
import { ExchangeSendAmountBadge } from './send/ExchangeSendAmountBadge';
import { ExchangeSendContent } from './send/ExchangeSendContent';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { TradingCard } from '../general/TradingCard';
import { TradingCardSection } from '../general/TradingCardSection';

type ExchangeCardProps = {
    isAmountInputActive: boolean;
};

const EXCHANGE_CARD_TEST_ID = '@trading/exchangeCard';

export const ExchangeCard = ({ isAmountInputActive }: ExchangeCardProps) => {
    const { control } = useExchangeFormContext();
    const [receiveAsset, receiveCryptoAmount] = useWatch({
        name: ['receiveAsset', 'receiveCryptoAmount'],
        control,
    });

    return (
        <TradingCard isAmountInputActive={isAmountInputActive}>
            <TradingCardSection
                bottomBorder
                testID={`${EXCHANGE_CARD_TEST_ID}/sendSection`}
                title={<Translation id="moduleTrading.selectCoinToSell.title" />}
                titleAction={<ExchangeSendAmountBadge />}
            >
                <ExchangeSendContent />
            </TradingCardSection>
            <TradingCardSection
                readOnly
                testID={`${EXCHANGE_CARD_TEST_ID}/receiveSection`}
                title={<Translation id="moduleTrading.selectCoin.title" />}
                titleAction={
                    <CryptoToFiatValueBadge
                        cryptoId={receiveAsset?.cryptoId}
                        amount={receiveCryptoAmount}
                    />
                }
            >
                <ExchangeReceiveContent />
            </TradingCardSection>
        </TradingCard>
    );
};
