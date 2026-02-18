import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeSideCard } from '@suite-native/trading-atoms';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

export type SellFromAccountTradePreviewCardProps = {
    cryptoId?: CryptoId;
    fromStringValue?: string;
};

export const SellFromAccountTradePreviewCard = ({
    cryptoId,
    fromStringValue,
}: SellFromAccountTradePreviewCardProps) => {
    const fromAccount = useSelector(selectSellSelectedSendAccount);

    if (!cryptoId || !fromAccount) {
        return null;
    }

    return (
        <TradeSideCard
            accountLabel={fromAccount.accountLabel}
            cryptoId={cryptoId}
            amount={
                fromStringValue ? (
                    <Text variant="body-sm" color="textAlertRed">
                        -{fromStringValue}
                    </Text>
                ) : null
            }
            title={<Translation id="moduleTrading.tradingSellPreviewScreen.fromAccount" />}
        />
    );
};
