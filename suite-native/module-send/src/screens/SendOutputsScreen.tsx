import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import { AccountDetailsCard } from '@suite-native/accounts';
import {
    Screen,
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';

import { AccountBalanceScreenHeader } from '../components/AccountBalanceScreenHeader';
import { SendFeeSection } from '../components/SendFeeSection';
import { SendFormProvider } from '../components/SendFormProvider';
import { SendFormSubmissionSection } from '../components/SendFormSubmissionSection';
import { SendOutputSection } from '../components/SendOutputSection';
import { useShowDeviceDisconnectedAlert } from '../hooks/useShowDeviceDisconnectedAlert';

export const SendOutputsScreen = ({
    route: { params },
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputs>) => {
    const { accountKey, tokenContract, postNavigationAction, initialAddress, initialAmount } =
        params;
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedAlert();

    useFocusEffect(
        useCallback(() => {
            if (postNavigationAction !== 'deviceDisconnectedAlert') return;

            // One-shot param: clear it immediately to avoid re-triggering on subsequent focus.
            navigation.setParams({ postNavigationAction: undefined });
            showDeviceDisconnectedAlert();
        }, [navigation, postNavigationAction, showDeviceDisconnectedAlert]),
    );

    return (
        <Screen
            header={
                <AccountBalanceScreenHeader accountKey={accountKey} tokenContract={tokenContract} />
            }
        >
            <>
                <AccountDetailsCard accountKey={accountKey} tokenContract={tokenContract} />
                <SendFormProvider
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    initialAddress={initialAddress}
                    initialAmount={initialAmount}
                >
                    <SendOutputSection accountKey={accountKey} tokenContract={tokenContract} />
                    <SendFeeSection accountKey={accountKey} tokenContract={tokenContract} />
                    <SendFormSubmissionSection
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                </SendFormProvider>
            </>
        </Screen>
    );
};
