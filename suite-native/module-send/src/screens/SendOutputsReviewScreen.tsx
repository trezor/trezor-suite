import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Box, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    RootStackRoutes,
    ScreenHeader,
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
    TransactionDetailStackRoutes,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import {
    ReviewOutputItemList,
    TransactionReviewOutputsState,
    TxValidityTimer,
    selectIsTransactionAlreadySigned,
    selectReviewSummaryOutput,
    selectTransactionReviewOutputsFromDraft,
    useOutputsReviewBackInterceptor,
} from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CommonActions, useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';
import { useDispatch } from '@suite-common/redux-utils';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { cleanupSendFormThunk, sendTransactionThunk } from '@suite-native/send';
import { useAtomValue } from 'jotai';
import { TransactionReviewScreen } from '@suite-native/transaction-review';
import { wasAppLeftDuringReviewAtom } from '../atoms/wasAppLeftDuringReviewAtom';
import { OutputsReviewFooter } from '../components/OutputsReviewFooter';
import { useTxValidityFlow } from '../hooks/useTxValidityFlow';

const spacerStyle = prepareNativeStyle(_ => ({
    height: 150,
}));

type SendOutputsReviewScreenProps = StackProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview
>;

interface NavigateOutOfSendFlowActionProps {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    txid?: string;
}

const navigateOutOfSendFlowAction = ({
    accountKey,
    tokenContract,
    txid,
}: NavigateOutOfSendFlowActionProps) => {
    const routes: any[] = [
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
    ];

    if (txid) {
        routes.push({
            name: RootStackRoutes.TransactionDetailStack,
            params: {
                screen: TransactionDetailStackRoutes.TransactionDetail,
                params: {
                    accountKey,
                    tokenContract,
                    txid,
                    closeActionType: 'close',
                    source: 'send',
                },
            },
        });
    }

    // Reset navigation stack to the transaction detail screen with HomeStack as a previous step, so the user can navigate back there.
    return CommonActions.reset({
        index: 1,
        routes,
    });
};

export const SendOutputsReviewScreen = ({ route }: SendOutputsReviewScreenProps) => {
    const { accountKey, tokenContract } = route.params;

    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { showAlert } = useAlert();
    const wasAppLeftDuringReview = useAtomValue(wasAppLeftDuringReviewAtom);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);

    const reviewOutputs =
        useSelector((state: TransactionReviewOutputsState) =>
            selectTransactionReviewOutputsFromDraft(state, 'send', accountKey, tokenContract),
        ) || undefined;

    const summaryOutput =
        useSelector((state: TransactionReviewOutputsState) =>
            selectReviewSummaryOutput(state, 'send', accountKey, tokenContract),
        ) || undefined;

    const onSendTransaction = async () => {
        if (!account) return;

        const sendResponse = await dispatch(
            sendTransactionThunk({
                selectedAccount: account,
                wasAppLeftDuringReview,
            }),
        );

        if (isFulfilled(sendResponse)) {
            const { txid } = sendResponse.payload.payload;

            return txid;
        }

        showAlert({
            icon: 'warningCircle',
            title: (
                <Translation
                    id={
                        account.networkType === 'solana'
                            ? 'moduleSend.review.outputs.errorAlert.solana.title'
                            : 'moduleSend.review.outputs.errorAlert.generic.title'
                    }
                />
            ),
            description: (
                <Translation
                    id={
                        account.networkType === 'solana'
                            ? 'moduleSend.review.outputs.errorAlert.solana.description'
                            : 'moduleSend.review.outputs.errorAlert.generic.description'
                    }
                />
            ),
            primaryButtonTitle: <Translation id="generic.buttons.tryAgain" />,
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            //onPressPrimaryButton: handleRetryAfterExpiry,
            secondaryButtonTitle: (
                <Translation id="moduleSend.review.outputs.errorAlert.secondaryButtonTitle" />
            ),
            onPressSecondaryButton: () => {
                dispatch(
                    cleanupSendFormThunk({ accountKey, tokenContract, shouldDeleteDraft: true }),
                );
                navigation.dispatch(
                    navigateOutOfSendFlowAction({
                        accountKey,
                        tokenContract,
                    }),
                );
            },
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
        });
    };

    const onSendTransactionSuccess = (txid: string) => {
        navigation.dispatch(
            navigateOutOfSendFlowAction({
                accountKey,
                tokenContract,
                txid,
            }),
        );

        dispatch(cleanupSendFormThunk({ accountKey, tokenContract }));
    };

    return (
        <TransactionReviewScreen
            prefix="send"
            accountKey={accountKey}
            tokenContract={tokenContract}
            reviewOutputs={reviewOutputs}
            summaryOutput={summaryOutput}
            onSendTransaction={onSendTransaction}
            onSendTransactionSuccess={onSendTransactionSuccess}
            isTransactionAlreadySigned={isTransactionAlreadySigned}
            titleTranslationId="moduleSend.review.outputs.title"
            summaryTranslationId="transactionManagement.review.outputs.summary.label"
            sendButtonTranslationId="moduleSend.review.outputs.submitButton"
        />
    );
};

export const SendOutputsReviewScreen2 = ({
    route,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputsReview>) => {
    const { accountKey, tokenContract } = route.params;

    const { confirmOnTrezorRef, closeSheet, revealConfirmOnTrezorSheet } =
        useConfirmOnTrezorController();

    const { applyStyle } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const isTransactionAlreadySigned = useSelector(selectIsTransactionAlreadySigned);
    const showOutputsReviewFooter = isTransactionAlreadySigned && account;

    const [isSendInProgress, setIsSendInProgress] = useState(false);

    const navigateToInitialScreen = useNavigateToInitialScreen();
    useOutputsReviewBackInterceptor(navigateToInitialScreen);

    const { showTimer, secondsLeft, isPastDeadline, isBroadcasting, onRetry, isRetryDisabled } =
        useTxValidityFlow({
            accountKey,
            tokenContract,
            revealConfirmOnTrezorSheet,
            isSendInProgress,
        });

    useEffect(() => {
        if (showOutputsReviewFooter) {
            closeSheet();
        }
    }, [closeSheet, showOutputsReviewFooter]);

    return (
        <ConfirmOnTrezorWrapper
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={
                <ScreenHeader
                    title={<Translation id="moduleSend.review.outputs.title" />}
                    closeActionType="close"
                />
            }
        >
            <VStack flex={1} spacing="sp16" justifyContent="space-between">
                <VStack spacing="sp16">
                    {showTimer && (
                        <TxValidityTimer
                            secondsLeft={secondsLeft}
                            isPastDeadline={isPastDeadline}
                            isBroadcasting={isBroadcasting}
                            onRetry={onRetry}
                            isRetryDisabled={isRetryDisabled}
                        />
                    )}
                    <ReviewOutputItemList
                        prefix="send"
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                </VStack>
                {showOutputsReviewFooter ? (
                    <OutputsReviewFooter
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                        isPastDeadline={isPastDeadline}
                        isSendInProgress={isSendInProgress}
                        setIsSendInProgress={setIsSendInProgress}
                    />
                ) : (
                    <Box style={applyStyle(spacerStyle)} />
                )}
            </VStack>
        </ConfirmOnTrezorWrapper>
    );
};
