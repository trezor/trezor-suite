import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectTradingExchangeActiveQuote } from '@suite-common/trading';
import {
    type RootStackParamList,
    Screen,
    type StackToStackCompositeScreenProps,
    type TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';

import { ExchangeConfirmationHeader } from '../components/exchange/Confirmation/ExchangeConfirmationHeader';
import { ExchangeConfirmationInfo } from '../components/exchange/Confirmation/ExchangeConfirmationInfo';
import { ExchangeConfirmationTitle } from '../components/exchange/Confirmation/ExchangeConfirmationTitle';
import { ExploreInBlockchainButton } from '../components/exchange/Confirmation/ExploreInBlockchainButton';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';

export type TradingConfirmingScreenProps = StackToStackCompositeScreenProps<
    TradingStackParamList,
    TradingStackRoutes.TradingConfirming,
    RootStackParamList
>;

export const TradingConfirmingScreen = ({
    route: { params },
    navigation,
}: TradingConfirmingScreenProps) => {
    const { variant } = params;

    const quote = useSelector(selectTradingExchangeActiveQuote);
    const quoteStatus = quote?.status;

    // TODO 25742 should it be here?
    // TODO 25742 tests
    useFocusEffect(
        useCallback(() => {
            switch (quoteStatus) {
                case 'SUCCESS':
                    navigation.popToTop();
                    break;

                case 'APPROVAL_REQ':
                    // TODO 25742 should there be some delay and e.g. animation?
                    navigation.navigate(TradingStackRoutes.TradingExchangeApproval, {
                        isRevoked: variant === 'revoke',
                    });
                    break;

                // TODO 25742 what is the right one?
                case 'SIGN_DATA':
                    // TODO 25742 should there be some delay and e.g. animation?
                    navigation.navigate(TradingStackRoutes.TradingExchangePreview, {
                        isApproved: true,
                    });
                    break;

                default:
                    break;
            }
        }, [quoteStatus, navigation, variant]),
    );

    return (
        <TradingDeviceConnectionGuard>
            <Screen header={<ExchangeConfirmationHeader variant={variant} />}>
                <ExchangeConfirmationTitle variant={variant} />
                <ExchangeConfirmationInfo variant={variant} />
                <ExploreInBlockchainButton />
            </Screen>
        </TradingDeviceConnectionGuard>
    );
};
