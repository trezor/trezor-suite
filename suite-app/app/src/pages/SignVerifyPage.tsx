import { selectFullSelectedAccount } from '@suite/account';
import { SignVerify } from '@suite/sign-verify';
import {
    ConnectDeviceGenericPromo,
    WalletLayout,
    WalletSubpageHeading,
    useSelector,
} from '@trezor/suite';

export const SignVerifyPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { account } = selectedAccount;

    if (account === undefined) {
        return null;
    }

    return (
        <SignVerify
            account={account}
            renderShell={({ title, isDeviceConnected, children }) => (
                <WalletLayout title={title} isSubpage account={selectedAccount}>
                    <WalletSubpageHeading title={title} />

                    {!isDeviceConnected && <ConnectDeviceGenericPromo />}

                    {children}
                </WalletLayout>
            )}
        />
    );
};
