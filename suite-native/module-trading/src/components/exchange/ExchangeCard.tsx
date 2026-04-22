import { Translation } from '@suite-native/intl';

import { ExchangeReceiveContent } from './receive/ExchangeReceiveContent';
import { ExchangeSendAmountBadge } from './send/ExchangeSendAmountBadge';
import { ExchangeSendContent } from './send/ExchangeSendContent';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { CryptoToFiatValueBadge } from '../general/CryptoToFiatValueBadge';
import { TradingCard } from '../general/TradingCard';
import { TradingCardSection } from '../general/TradingCardSection';

type ExchangeCardProps = {
    isAmountInputActive: boolean;
};

const EXCHANGE_CARD_TEST_ID = '@trading/exchangeCard';

export const ExchangeCard = ({ isAmountInputActive }: ExchangeCardProps) => {
    const { watch } = useExchangeFormContext();
    const [receiveAsset, receiveCryptoAmount] = watch(['receiveAsset', 'receiveCryptoAmount']);

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
