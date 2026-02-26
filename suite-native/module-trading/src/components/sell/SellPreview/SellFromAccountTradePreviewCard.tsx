import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeSideCard } from '@suite-native/trading-atoms';
import { selectSellSelectedSendAccount } from '@suite-native/trading-state';

import { CryptoToFiatValueBadge } from '../../general/CryptoToFiatValueBadge';

export type SellFromAccountTradePreviewCardProps = {
    cryptoId?: CryptoId;
    fromStringValue?: string;
    fromValue?: string;
};

export const SellFromAccountTradePreviewCard = ({
    cryptoId,
    fromStringValue,
    fromValue,
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
        >
            {!!fromValue && (
                <CryptoToFiatValueBadge
                    amount={fromValue}
                    cryptoId={cryptoId}
                    color="textSubdued"
                    textAlign="right"
                />
            )}
        </TradeSideCard>
    );
};
