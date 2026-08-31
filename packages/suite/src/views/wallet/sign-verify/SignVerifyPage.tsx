import { selectFullSelectedAccount } from '@suite/account';
import { SignVerify } from '@suite/sign-verify';
import { useSelector } from '@suite-common/redux-utils';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

export const SignVerifyPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { account } = selectedAccount;

    if (account === undefined) {
        return null;
    }

    return (
        <SignVerify
            account={account}
            network={selectedAccount.network}
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
