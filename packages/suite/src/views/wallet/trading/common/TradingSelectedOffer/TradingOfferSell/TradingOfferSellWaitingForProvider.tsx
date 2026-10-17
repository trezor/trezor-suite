import { Translation } from '@suite-lego/intl';
import { Column, Spinner, Text } from '@trezor/components';

type TradingOfferSellWaitingForProviderProps = {
    providerName: string;
    displaySymbol: string;
};

export const TradingOfferSellWaitingForProvider = ({
    providerName,
    displaySymbol,
}: TradingOfferSellWaitingForProviderProps) => (
    <Column alignItems="center" gap={8} padding={{ vertical: 16 }}>
        <Spinner size={40} isDisabled margin={{ bottom: 8 }} />
        <Text>
            <Translation
                id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO"
                values={{ providerName, displaySymbol }}
            />
        </Text>
        <Text intent="neutral" priority="secondary">
            <Translation
                id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO_INFO"
                values={{ providerName, displaySymbol }}
            />
        </Text>
    </Column>
);
