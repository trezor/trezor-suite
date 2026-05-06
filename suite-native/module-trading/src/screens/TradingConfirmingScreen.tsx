import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    selectTradingExchangeActiveQuote,
    tradingExchangeActions,
    useAllowanceTxTracking,
} from '@suite-common/trading';
import { sendFormActions } from '@suite-common/wallet-core';
import {
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';
import { useTransactionStatusOverride } from '@suite-native/trading-debug';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { useTransactionDetails } from '@suite-native/transaction-management';
import { exhaustive } from '@trezor/type-utils';

import { ConfirmationQuoteDebugView } from '../components/exchange/Confirmation/ConfirmationQuoteDebugView';
import { ExchangeConfirmationHeader } from '../components/exchange/Confirmation/ExchangeConfirmationHeader';
import { ExchangeConfirmationInfo } from '../components/exchange/Confirmation/ExchangeConfirmationInfo';
import { ExchangeConfirmationTitle } from '../components/exchange/Confirmation/ExchangeConfirmationTitle';
import { ExploreInBlockchainButton } from '../components/exchange/Confirmation/ExploreInBlockchainButton';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';
import { useApprovalFlow } from '../hooks/exchange/Approval/useApprovalFlow';

export type TradingConfirmingScreenProps = StackProps<
    RootStackParamList,
    RootStackRoutes.TradingConfirming
>;

export const TradingConfirmingScreen = ({
    route: { params },
    navigation,
}: TradingConfirmingScreenProps) => {
    const { flowType } = params;

    const dispatch = useDispatch();
    const sendAccount = useSelector(selectExchangeSelectedSendAccount);
    const activeQuote = useSelector(selectTradingExchangeActiveQuote);
    const accountKey = sendAccount?.key ?? null;
    const approvalSendTxHash = activeQuote?.approvalSendTxHash;

    const { confirmApproval } = useApprovalFlow();

    const hasConfirmedRef = useRef(false);

    const {
        status: originalStatus,
        approvalTxid,
        setApprovalTxid,
    } = useAllowanceTxTracking({ accountKey });

    useEffect(() => {
        if (approvalSendTxHash) {
            setApprovalTxid(approvalSendTxHash);
        }
    }, [approvalSendTxHash, setApprovalTxid]);

    const { status, forceStatus } = useTransactionStatusOverride(originalStatus);

    const { transaction, openInBlockchain } = useTransactionDetails({
        accountKey,
        txid: approvalTxid,
    });

    const { isConfirmed, isFailed, isPending } = status;

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            const { type, payload } = e.data.action as {
                type: string;
                payload?: { count?: number };
            };
            const isSingleBackPress =
                type === 'GO_BACK' || (type === 'POP' && (payload?.count ?? 1) <= 1);

            if (isSingleBackPress) {
                dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
            }
        });

        return unsubscribe;
    }, [dispatch, navigation]);

    useFocusEffect(
        useCallback(() => {
            if (!isConfirmed || !activeQuote || hasConfirmedRef.current) return;

            hasConfirmedRef.current = true;

            const handleConfirmed = async () => {
                switch (flowType) {
                    case 'approve': {
                        let response = await confirmApproval(activeQuote);

                        if (response?.status === 'APPROVAL_PENDING') {
                            // we know it was confirmed, so we can set the status to CONFIRM even if it came as APPROVAL_PENDING
                            // that is basically what api does (but it takes time)
                            // so we need to do it here to avoid the approval screen transition through useExchangeFlow
                            response = { ...response, status: 'CONFIRM' };
                            dispatch(tradingExchangeActions.saveSelectedQuote(response));
                        }

                        if (!response) {
                            // confirmApproval already sets the error state — stay on this screen.
                            hasConfirmedRef.current = false;

                            return;
                        }

                        dispatch(sendFormActions.dispose());
                        navigation.popToTop();
                        navigation.push(RootStackRoutes.TradingExchangePreview, {
                            isApproved: true,
                        });
                        break;
                    }

                    case 'revoke-and-approve':
                        dispatch(sendFormActions.dispose());
                        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
                        // preselectedQuote is preserved in the store, so we can navigate to the approval screen with it
                        navigation.popToTop();
                        navigation.push(RootStackRoutes.TradingExchangeApproval, {
                            isRevoked: true,
                        });
                        break;

                    case 'revoke':
                        dispatch(sendFormActions.dispose());
                        dispatch(tradingExchangeActions.saveSelectedQuote(undefined));
                        dispatch(tradingExchangeActions.savePreselectedQuote(undefined));
                        navigation.popToTop();
                        break;

                    default:
                        exhaustive(flowType);
                }
            };

            void handleConfirmed().catch(() => {
                hasConfirmedRef.current = false;
            });
        }, [isConfirmed, activeQuote, flowType, confirmApproval, dispatch, navigation]),
    );

    return (
        <TradingDeviceConnectionGuard>
            <Screen header={<ExchangeConfirmationHeader flowType={flowType} />}>
                <ConfirmationQuoteDebugView
                    forceStatus={forceStatus}
                    approvalTxid={approvalTxid}
                    transactionStatus={status}
                />
                <ExchangeConfirmationTitle
                    flowType={flowType}
                    isFailed={isFailed}
                    isPending={isPending}
                />
                <ExchangeConfirmationInfo flowType={flowType} transaction={transaction} />
                <ExploreInBlockchainButton onPress={openInBlockchain} />
            </Screen>
        </TradingDeviceConnectionGuard>
    );
};
