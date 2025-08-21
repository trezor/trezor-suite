import { useEffect, useState } from 'react';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';
import { useAtomValue } from 'jotai';

import {
    AccountsRootState,
    TransactionsRootState,
    selectAccountByKey,
    selectTransactionByAccountKeyAndTxid,
} from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Button, Card } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { wasAppLeftDuringReviewAtom } from '../atoms/wasAppLeftDuringReviewAtom';
import { cleanupSendFormThunk, sendTransactionThunk } from '../sendFormThunks';
import { SignSuccessMessage } from './SignSuccessMessage';
import { useUtxoSelection } from '../hooks/useUtxoSelection';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendOutputsReview,
    RootStackParamList
>;

const navigateOutOfSendFlowAction = ({
    accountKey,
    tokenContract,
    txid,
}: {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    txid?: string;
}) => {
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
            name: RootStackRoutes.TransactionDetail,
            params: {
                accountKey,
                tokenContract,
                txid,
                closeActionType: 'close',
            },
        });
    }

    // Reset navigation stack to the transaction detail screen with HomeStack as a previous step, so the user can navigate back there.
    return CommonActions.reset({
        index: 1,
        routes,
    });
};

type OutputsReviewFooterParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const OutputsReviewFooter = ({ accountKey, tokenContract }: OutputsReviewFooterParams) => {
    const [txid, setTxid] = useState<string>('');
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const [isSendInProgress, setIsSendInProgress] = useState(false);
    const wasAppLeftDuringReview = useAtomValue(wasAppLeftDuringReviewAtom);
    const { setSelectedUtxos } = useUtxoSelection(accountKey);
    const { translate } = useTranslate();

    const isTransactionProcessedByBackend = !!useSelector((state: TransactionsRootState) =>
        selectTransactionByAccountKeyAndTxid(state, accountKey, txid),
    );

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    useEffect(() => {
        // Navigate to transaction detail screen only at the moment when the transaction was already processed by backend and we have all its data.
        if (isTransactionProcessedByBackend) {
            navigation.dispatch(
                navigateOutOfSendFlowAction({
                    accountKey,
                    tokenContract,
                    txid,
                }),
            );

            dispatch(cleanupSendFormThunk({ accountKey }));
        }
    }, [isTransactionProcessedByBackend, accountKey, tokenContract, txid, navigation, dispatch]);

    if (!account) {
        return null;
    }

    const isSolanaAccount = account.networkType === 'solana';

    const handleSendTransaction = async () => {
        setIsSendInProgress(true);

        const sendResponse = await dispatch(
            sendTransactionThunk({
                selectedAccount: account,
                wasAppLeftDuringReview,
            }),
        );

        if (isFulfilled(sendResponse)) {
            const { txid: sentTxid } = sendResponse.payload.payload;

            setTxid(sentTxid);
            if (account.networkType === 'bitcoin') setSelectedUtxos([]); // clear selected UTXOs after sending the transaction

            return;
        }

        showAlert({
            icon: 'warningCircle',
            title: (
                <Translation
                    id={
                        isSolanaAccount
                            ? 'moduleSend.review.outputs.errorAlert.solana.title'
                            : 'moduleSend.review.outputs.errorAlert.generic.title'
                    }
                />
            ),
            description: (
                <Translation
                    id={
                        isSolanaAccount
                            ? 'moduleSend.review.outputs.errorAlert.solana.description'
                            : 'moduleSend.review.outputs.errorAlert.generic.description'
                    }
                />
            ),
            primaryButtonTitle: <Translation id="generic.buttons.tryAgain" />,
            primaryButtonVariant: 'redBold',
            onPressPrimaryButton: () => {
                dispatch(cleanupSendFormThunk({ accountKey, shouldDeleteDraft: false }));
                navigation.navigate(SendStackRoutes.SendOutputs, {
                    accountKey,
                    tokenContract,
                });
            },
            secondaryButtonTitle: (
                <Translation id="moduleSend.review.outputs.errorAlert.secondaryButtonTitle" />
            ),
            onPressSecondaryButton: () => {
                dispatch(cleanupSendFormThunk({ accountKey, shouldDeleteDraft: true }));
                navigation.dispatch(
                    navigateOutOfSendFlowAction({
                        accountKey,
                        tokenContract,
                    }),
                );
            },
            secondaryButtonVariant: 'redElevation1',
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
                    accessibilityLabel={translate('generic.validateForm')}
                    testID="@send/send-transaction-button"
                    onPress={handleSendTransaction}
                >
                    <Translation id="moduleSend.review.outputs.submitButton" />
                </Button>
            </Card>
        </Animated.View>
    );
};
