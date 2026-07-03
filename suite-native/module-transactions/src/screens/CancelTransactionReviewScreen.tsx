import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/native';
import { isFulfilled, isRejected } from '@reduxjs/toolkit';

import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectIsTransactionPending,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Box, Button, Card, Spinner, Text, VStack } from '@suite-native/atoms';
import {
    ConfirmOnTrezorWrapper,
    useConfirmOnTrezorController,
} from '@suite-native/confirm-on-trezor';
import { Translation } from '@suite-native/intl';
import {
    AppTabsRoutes,
    RootStackRoutes,
    ScreenHeader,
    type StackProps,
    type TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import {
    cleanupSendFormThunk,
    sendTransactionThunk,
    signTransactionNativeThunk,
} from '@suite-native/send';
import {
    FeeSummaryCard,
    composeEthereumCancelTransactionThunk,
} from '@suite-native/transaction-management';

// Reset the stack so the user lands on the freshly broadcast cancel transaction with the account
// detail as its previous step.
const navigateToCancelTransactionDetail = ({
    accountKey,
    txid,
}: {
    accountKey: AccountKey;
    txid: string;
}) =>
    CommonActions.reset({
        index: 1,
        routes: [
            {
                name: RootStackRoutes.AppTabs,
                params: { screen: AppTabsRoutes.HomeStack },
            },
            {
                name: RootStackRoutes.AccountDetail,
                params: { accountKey },
            },
            {
                name: RootStackRoutes.TransactionDetailStack,
                params: {
                    screen: TransactionDetailStackRoutes.TransactionDetail,
                    params: { accountKey, txid, closeActionType: 'close' },
                },
            },
        ],
    });

export const CancelTransactionReviewScreen = ({
    route,
}: StackProps<
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes.CancelTransactionReview
>) => {
    const { accountKey, txid } = route.params;

    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { showAlert } = useAlert();
    const { confirmOnTrezorRef, revealConfirmOnTrezorSheet, closeSheet } =
        useConfirmOnTrezorController();

    const [composedCancel, setComposedCancel] = useState<GeneralPrecomposedTransactionFinal | null>(
        null,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTxid, setNewTxid] = useState('');

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isOriginalPending = useSelector((state: TransactionsRootState) =>
        selectIsTransactionPending(state, accountKey, txid),
    );
    const isCancelTransactionProcessed = !!useSelector((state: TransactionsRootState) =>
        newTxid ? selectTransactionByAccountKeyAndTxid(state, accountKey, newTxid) : undefined,
    );

    // Compose the replacement (zero-value self-send reusing the stuck nonce) once on mount.
    useEffect(() => {
        let isActive = true;

        const composeCancel = async () => {
            const response = await dispatch(
                composeEthereumCancelTransactionThunk({ accountKey, txid }),
            );

            if (isActive && isFulfilled(response)) {
                setComposedCancel(response.payload);
            }
        };

        composeCancel();

        return () => {
            isActive = false;
        };
    }, [accountKey, txid, dispatch]);

    // Once the broadcast cancel tx is registered by the backend, leave the flow and show its detail.
    useEffect(() => {
        if (isCancelTransactionProcessed) {
            dispatch(cleanupSendFormThunk({ accountKey }));
            navigation.dispatch(navigateToCancelTransactionDetail({ accountKey, txid: newTxid }));
        }
    }, [isCancelTransactionProcessed, accountKey, newTxid, navigation, dispatch]);

    const handleCancelTransaction = async () => {
        if (!account || !composedCancel || !isOriginalPending) {
            return;
        }

        setIsSubmitting(true);
        revealConfirmOnTrezorSheet();

        const signResponse = await dispatch(
            signTransactionNativeThunk({ accountKey, feeLevel: composedCancel }),
        );

        if (isRejected(signResponse)) {
            // signTransactionThunk already surfaces sign errors (including user rejection) via a toast.
            closeSheet();
            setIsSubmitting(false);

            return;
        }

        const sendResponse = await dispatch(
            sendTransactionThunk({ selectedAccount: account, wasAppLeftDuringReview: false }),
        );

        closeSheet();

        if (isFulfilled(sendResponse)) {
            setNewTxid(sendResponse.payload.payload.txid);

            return;
        }

        setIsSubmitting(false);

        // The most likely broadcast failure is the original tx confirming during signing, which
        // makes the reused nonce unusable. Surface a friendly explanation instead of a raw error.
        showAlert({
            icon: 'warningCircle',
            title: <Translation id="transactions.cancel.error.title" />,
            description: <Translation id="transactions.cancel.error.description" />,
            primaryButtonTitle: <Translation id="generic.buttons.close" />,
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: () => navigation.goBack(),
        });
    };

    const renderContent = () => {
        if (!account || !composedCancel) {
            return (
                <Box flex={1} justifyContent="center" alignItems="center">
                    <Spinner />
                </Box>
            );
        }

        // The original tx confirmed (or otherwise left the pending set) while the screen was open,
        // so there is nothing left to cancel.
        if (!isOriginalPending && !newTxid) {
            return (
                <VStack flex={1} spacing="sp24" justifyContent="space-between">
                    <Card>
                        <VStack spacing="sp8">
                            <Text variant="body-md-strong">
                                <Translation id="transactions.cancel.alreadyConfirmed.title" />
                            </Text>
                            <Text color="contentSecondary">
                                <Translation id="transactions.cancel.alreadyConfirmed.description" />
                            </Text>
                        </VStack>
                    </Card>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onPress={() => navigation.goBack()}
                    >
                        <Translation id="generic.buttons.close" />
                    </Button>
                </VStack>
            );
        }

        return (
            <VStack flex={1} spacing="sp24" justifyContent="space-between">
                <VStack spacing="sp16">
                    <Card>
                        <Text color="contentSecondary">
                            <Translation id="transactions.cancel.review.description" />
                        </Text>
                    </Card>
                    <FeeSummaryCard
                        fee={composedCancel.fee}
                        symbol={account.symbol}
                        networkType={account.networkType}
                        areFeesLoading={false}
                        label={<Translation id="transactions.cancel.review.feeLabel" />}
                    />
                </VStack>
                <Button
                    intent="critical"
                    isLoading={isSubmitting}
                    isDisabled={isSubmitting}
                    testID="@transactions/cancel-transaction-button"
                    onPress={handleCancelTransaction}
                >
                    <Translation id="transactions.cancel.review.submitButton" />
                </Button>
            </VStack>
        );
    };

    return (
        <ConfirmOnTrezorWrapper
            controlRef={confirmOnTrezorRef}
            closeActionType="close"
            defaultHeader={
                <ScreenHeader
                    title={<Translation id="transactions.cancel.review.title" />}
                    closeActionType="close"
                />
            }
        >
            {renderContent()}
        </ConfirmOnTrezorWrapper>
    );
};
