import { useDispatch, useSelector } from 'react-redux';

import { CommonActions, useNavigation } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import {
    AccountsRootState,
    selectAccountByKey,
    selectSendSignedTx,
} from '@suite-common/wallet-core';
import { Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';
import { VStack, Button } from '@suite-native/atoms';
import { RootStackRoutes, AppTabsRoutes } from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

import { sendTransactionAndCleanupSendFormThunk } from '../sendFormThunks';

const navigateToAccountDetail = ({ accountKey }: { accountKey: AccountKey }) =>
    // Reset navigation stack to the account detail screen with HomeStack as a previous step, so the user can navigate back there.
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
                },
            },
        ],
    });

export const SendTransactionButton = ({ accountKey }: { accountKey: AccountKey }) => {
    const dispatch = useDispatch();
    const { showToast } = useToast();
    const navigation = useNavigation();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const signedTransaction = useSelector(selectSendSignedTx);

    if (!signedTransaction || !account) return null;

    const handleSendTransaction = async () => {
        const sendResponse = await dispatch(
            sendTransactionAndCleanupSendFormThunk({ account, signedTransaction }),
        ).unwrap();

        if (isRejected(sendResponse)) {
            // TODO: set error state
        }

        showToast({ variant: 'success', message: 'Transaction sent', icon: 'check' });

        navigation.dispatch(navigateToAccountDetail({ accountKey }));
    };

    return (
        <VStack>
            <Text color="borderSecondary">Transaction was signed by the Trezor device.</Text>
            <Button
                accessibilityRole="button"
                accessibilityLabel="validate send form"
                testID="@send/send-transaction-button"
                onPress={handleSendTransaction}
            >
                Send transaction
            </Button>
        </VStack>
    );
};
