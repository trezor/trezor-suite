import { selectFullSelectedAccount } from '@suite/account';
import { SignVerify } from '@suite/sign-verify';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
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
            renderShell={({ title, isDeviceConnected, headingAction, children }) => (
                <WalletLayout title={title} isSubpage account={selectedAccount}>
                    <WalletSubpageHeading title={title}>{headingAction}</WalletSubpageHeading>

                    {!isDeviceConnected && <ConnectDeviceGenericPromo />}

                    {children}
                </WalletLayout>
            )}
        />
    );
};
