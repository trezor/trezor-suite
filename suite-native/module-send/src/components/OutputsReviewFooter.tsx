import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { SlideInDown } from 'react-native-reanimated';

import { useAtomValue } from 'jotai';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { G } from '@mobily/ts-belt';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    AccountsRootState,
    pushSendFormTransactionThunk,
    selectAccountByKey,
    selectSendFormDraftByKey,
    selectTransactionByAccountKeyAndTxid,
    SendRootState,
    TransactionsRootState,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Button, Card } from '@suite-native/atoms';
import {
    RootStackRoutes,
    AppTabsRoutes,
    RootStackParamList,
    SendStackRoutes,
    SendStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { analytics, EventType } from '@suite-native/analytics';
import { selectAccountTokenSymbol, TokensRootState } from '@suite-native/tokens';
import { useAlert } from '@suite-native/alerts';

import { SendConfirmOnDeviceImage } from './SendConfirmOnDeviceImage';
import { cleanupSendFormThunk } from '../sendFormThunks';
import { wasAppLeftDuringReviewAtom } from '../atoms/wasAppLeftDuringReviewAtom';
import { selectIsTransactionAlreadySigned } from '../selectors';
import { SignSuccessMessage } from './SignSuccessMessage';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

const navigateToTransactionDetail = ({
    accountKey,
    tokenContract,
    txid,
}: RootStackParamList[RootStackRoutes.TransactionDetail]) =>
    // Reset navigation stack to the transaction detail screen with HomeStack as a previous step, so the user can navigate back there.
    CommonActions.reset({
        index: 1,
        routes: [
            {
                name: RootStackRoutes.AppTabs,
                params: {
                    screen: AppTabsRoutes.HomeStack,
                },
            },
            {
                name: RootStackRoutes.AccountDetail,
                params: {
                    accountKey,
                    tokenContract,
                },
            },
            {
                name: RootStackRoutes.TransactionDetail,
                params: {
                    accountKey,
                    tokenContract,
                    txid,
                    closeActionType: 'close',
                },
            },
        ],
    });

export const OutputsReviewFooter = ({
    accountKey,
    tokenContract,
}: {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
}) => {
    const [txid, setTxid] = useState<string>('');
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const [isSendInProgress, setIsSendInProgress] = useState(false);
    const wasAppLeftDuringReview = useAtomValue(wasAppLeftDuringReviewAtom);

    const isTransactionProcessedByBackend = !!useSelector((state: TransactionsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    );

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const formValues = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );

    useEffect(() => {
        // Navigate to transaction detail screen only at the moment when the transaction was already processed by backend and we have all its data.
        if (isTransactionProcessedByBackend) {
            navigation.dispatch(
                navigateToTransactionDetail({
                    accountKey,
                    tokenContract,
                    txid,
                }),
            );

            dispatch(cleanupSendFormThunk({ accountKey }));
        }
    }, [isTransactionProcessedByBackend, accountKey, tokenContract, txid, navigation, dispatch]);

    /* TODO: improve the illustration: https://github.com/trezor/trezor-suite/issues/13965 */
    if (!isTransactionAlreadySigned || !account) return <SendConfirmOnDeviceImage />;

    const handleSendTransaction = async () => {
        setIsSendInProgress(true);

        const sendResponse = await dispatch(
            pushSendFormTransactionThunk({
                selectedAccount: account,
                shouldDiscardTransaction: false,
            }),
        );
        if (isFulfilled(sendResponse)) {
            const { txid: sentTxid } = sendResponse.payload.payload;

            if (formValues) {
                analytics.report({
                    type: EventType.SendTransactionDispatched,
                    payload: {
                        symbol: account.symbol,
                        tokenAddresses: tokenContract ? [tokenContract] : undefined,
                        tokenSymbols: tokenSymbol ? [tokenSymbol] : undefined,
                        outputsCount: formValues.outputs.length,
                        selectedFee: formValues.selectedFee ?? 'normal',
                        hasRippleDestinationTag: G.isNotNullable(formValues.rippleDestinationTag),
                        wasAppLeftDuringReview,
                    },
                });
            }

            setTxid(sentTxid);

            return;
        }
        showAlert({
            icon: 'warningCircle',
            title: <Translation id="moduleSend.review.toasts.sendTxnFailed" />,
            description: sendResponse.payload?.metadata.payload.error ?? sendResponse.error.message,
            primaryButtonTitle: <Translation id="generic.buttons.close" />,
            primaryButtonVariant: 'redBold',
            onPressPrimaryButton: () => {
                dispatch(cleanupSendFormThunk({ accountKey, shouldDeleteDraft: true }));
                navigation.navigate(SendStackRoutes.SendOutputs, {
                    accountKey,
                    tokenContract,
                });
            },
        });
        setIsSendInProgress(false);
    };

    return (
        <Animated.View entering={SlideInDown}>
            <Card>
                <SignSuccessMessage />
                <Button
                    isLoading={isSendInProgress}
                    accessibilityRole="button"
                    accessibilityLabel="validate send form"
                    testID="@send/send-transaction-button"
                    onPress={handleSendTransaction}
                >
                    <Translation id="moduleSend.review.outputs.submitButton" />
                </Button>
            </Card>
        </Animated.View>
    );
};
