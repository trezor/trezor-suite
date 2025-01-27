import { useDispatch, useSelector } from 'react-redux';

import { AccountsRootState, accountsActions, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Button, TrezorSuiteLiteHeader } from '@suite-native/atoms';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

type AccountSettingsRemoveCoinButtonProps = {
    accountKey: AccountKey;
};

export const AccountSettingsRemoveCoinButton = ({
    accountKey,
}: AccountSettingsRemoveCoinButtonProps) => {
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { showAlert, hideAlert } = useAlert();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigateToInitialScreen();
    };

    const handleShowAlert = () => {
        showAlert({
            pictogramVariant: 'critical',
            title: (
                <>
                    Do you really want to remove this coin from <TrezorSuiteLiteHeader />?
                </>
            ),
            description:
                'Your coins remain intact and safe. Import this coin again using your public key (XPUB) or receive address at any time.',
            primaryButtonTitle: 'Remove coin',
            primaryButtonVariant: 'redBold',
            onPressPrimaryButton: handleRemoveAccount,
            secondaryButtonTitle: 'Cancel',
            secondaryButtonVariant: 'redElevation0',
            onPressSecondaryButton: () => hideAlert(),
        });
    };

    return (
        <Button
            size="large"
            onPress={handleShowAlert}
            colorScheme="redElevation0"
            testID="@account-detail/settings/remove-coin-button"
        >
            Remove coin
        </Button>
    );
};
