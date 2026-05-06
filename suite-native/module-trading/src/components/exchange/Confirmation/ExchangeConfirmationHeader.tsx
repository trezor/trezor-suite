import type { ComponentProps } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import { Translation } from '@suite-native/intl';
import {
    type ConfirmingScreenFlowType,
    type RootStackParamList,
    type RootStackRoutes,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';

export type ExchangeConfirmationHeaderProps = {
    flowType: ConfirmingScreenFlowType;
};

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.TradingConfirming>;

export const ExchangeConfirmationHeader = ({ flowType }: ExchangeConfirmationHeaderProps) => {
    const navigation = useNavigation<NavigationProp>();

    const quote = useSelector(selectTradingExchangeActiveQuote);

    const symbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    let title: ComponentProps<typeof ScreenHeader>['title'];
    if (symbol) {
        title =
            flowType === 'approve' ? (
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

    return <ScreenHeader title={title} closeActionType="close" closeAction={navigation.popToTop} />;
};
