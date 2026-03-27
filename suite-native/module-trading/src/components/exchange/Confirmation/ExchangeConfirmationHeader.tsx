import type { ComponentProps } from 'react';
import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import type { ConfirmationVariant } from '@suite-native/trading-types';

export type ExchangeConfirmationHeaderProps = {
    variant: ConfirmationVariant;
};

export const ExchangeConfirmationHeader = ({ variant }: ExchangeConfirmationHeaderProps) => {
    const quote = useSelector(selectTradingExchangeActiveQuote);

    const symbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    let title: ComponentProps<typeof ScreenHeader>['title'];
    if (symbol) {
        title =
            variant === 'approve' ? (
                <Translation
                    id="moduleTrading.tradingConfirmationScreen.approveHeaderTitle"
                    values={{ symbol }}
                />
            ) : (
                <Translation
                    id="moduleTrading.tradingConfirmationScreen.revokeHeaderTitle"
                    values={{ symbol }}
                />
            );
    }

    return <ScreenHeader title={title} closeActionType="close" />;
};
