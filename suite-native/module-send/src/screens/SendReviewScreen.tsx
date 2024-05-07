import { useDispatch, useSelector } from 'react-redux';

import { CommonActions } from '@react-navigation/native';
import { isRejected } from '@reduxjs/toolkit';

import {
    AppTabsRoutes,
    GoBackIcon,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { Button, Text, VStack } from '@suite-native/atoms';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { useToast } from '@suite-native/toasts';

import { sendTransactionAndCleanupSendFormThunk } from '../sendFormThunks';
import { ReviewOutputItemList } from '../components/ReviewOutputItemList';
import { selectNativeSignedTx } from '../sendFormReducer';

export const SendReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendReview>) => {
    const dispatch = useDispatch();
    const { showToast } = useToast();

    const { accountKey } = route.params;

    const signedTransaction = useSelector(selectNativeSignedTx);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return;

    const handleSendTransaction = async () => {
        if (!signedTransaction) return;

        const sendResponse = await dispatch(
            sendTransactionAndCleanupSendFormThunk({ account, signedTransaction }),
        ).unwrap();

        if (isRejected(sendResponse)) {
            // TODO: error handling
        }

        showToast({ variant: 'success', message: 'Transaction sent', icon: 'check' });

        // Reset navigation stack to the account detail screen with HomeStack as a previous step, so the user can navigate back there.
        navigation.dispatch(
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
            }),
        );
    };

    // TODO: move text content to @suite-native/intl package when is copy ready
    return (
        <Screen
            subheader={<ScreenSubHeader content="Send review screen" leftIcon={<GoBackIcon />} />}
        >
            <VStack justifyContent="center" alignItems="center">
                <ReviewOutputItemList accountKey={accountKey} />
                {signedTransaction && (
                    <VStack>
                        <Text color="borderSecondary">Transaction was signed on device.</Text>
                        <Button
                            accessibilityRole="button"
                            accessibilityLabel="validate send form"
                            testID="@send/send-transaction-button"
                            onPress={handleSendTransaction}
                        >
                            Send transaction
                        </Button>
                    </VStack>
                )}
            </VStack>
        </Screen>
    );
};
