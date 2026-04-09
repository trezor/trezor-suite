import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { useAllowanceTxTracking } from '@suite-common/trading';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    Screen,
    type StackToStackCompositeScreenProps,
    type TradingStackParamList,
    type TradingStackRoutes,
} from '@suite-native/navigation';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { ConfirmationQuoteDebugView } from '../components/exchange/Confirmation/ConfirmationQuoteDebugView';
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

    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const accountKey = sendAccount?.key ?? ('' as AccountKey);

    const { status, approvalTxid } = useAllowanceTxTracking({
        accountKey,
    });

    // TODO 25742 use this
    const _transaction = useSelector((state: TransactionsRootState & AccountsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, approvalTxid ?? ''),
    );

    const { isConfirmed, isFailed, isPending } = status;

    // TODO 25742 tests
    useFocusEffect(
        useCallback(() => {
            if (isConfirmed) {
                navigation.popToTop();
            }
        }, [isConfirmed, navigation]),
    );

    return (
        <TradingDeviceConnectionGuard>
            <Screen header={<ExchangeConfirmationHeader variant={variant} />}>
                <ConfirmationQuoteDebugView />
                <ExchangeConfirmationTitle
                    variant={variant}
                    isFailed={isFailed}
                    isPending={isPending}
                />
                <ExchangeConfirmationInfo variant={variant} />
                <ExploreInBlockchainButton />
            </Screen>
        </TradingDeviceConnectionGuard>
    );
};
