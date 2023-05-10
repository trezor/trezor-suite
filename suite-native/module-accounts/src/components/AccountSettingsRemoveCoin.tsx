import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { BottomSheet, Button, Card, Pictogram, VStack } from '@suite-native/atoms';
import {
    accountsActions,
    AccountsRootState,
    selectAccountByKey,
    selectNumberOfAccounts,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AccountsImportStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

const AccountSettingsRemoveCoinButton = ({ onPress }: { onPress: () => void }) => (
    <Button onPress={onPress} colorScheme="dangerElevation0">
        Remove coin
    </Button>
);

export const AccountSettingsRemoveCoin = ({ accountKey }: { accountKey: AccountKey }) => {
    const dispatch = useDispatch();
    const [isWarningSheetVisible, setIsWarningSheetVisible] = useState<boolean>(false);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountsLength = useSelector(selectNumberOfAccounts);

    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                RootStackParamList,
                RootStackRoutes.AccountSettings,
                RootStackParamList
            >
        >();

    if (!account) return null;

    const handleRemoveAccount = () => {
        console.log('handle remove account');
        dispatch(accountsActions.removeAccount([account]));

        const isLastAccount = accountsLength === 1;
        if (isLastAccount) {
            console.log('last account');
            navigation.navigate(RootStackRoutes.AccountsImport, {
                screen: AccountsImportStackRoutes.SelectNetwork,
            });
        } else {
            console.log('not last');
            navigation.reset({
                index: 0,
                routes: [
                    {
                        name: RootStackRoutes.AppTabs,
                        params: {
                            screen: HomeStackRoutes.Home,
                        },
                    },
                ],
            });
        }
    };

    const handleToggleBottomSheet = () => setIsWarningSheetVisible(!isWarningSheetVisible);

    return (
        <>
            <BottomSheet isVisible={isWarningSheetVisible} onClose={handleToggleBottomSheet}>
                <Card>
                    <VStack spacing="medium">
                        <Pictogram
                            variant="red"
                            icon="shieldWarning"
                            title="Do you really want to remove this coin from Trezor Suite Lite?"
                            subtitle="Your coins remain intact and safe. Import this coin again with Trezor Suite Lite using your public key (XPUB) at any time."
                        />
                        <AccountSettingsRemoveCoinButton onPress={handleRemoveAccount} />
                        <Button colorScheme="tertiaryElevation0" onPress={handleToggleBottomSheet}>
                            Cancel
                        </Button>
                    </VStack>
                </Card>
            </BottomSheet>
            <AccountSettingsRemoveCoinButton onPress={handleToggleBottomSheet} />
        </>
    );
};
