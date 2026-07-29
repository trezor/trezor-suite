import { SignVerify } from '@suite/sign-verify';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

export const SignVerifyPage = () => (
    <SignVerify
        renderShell={({ title, selectedAccount, isDeviceConnected, headingAction, children }) => (
            <WalletLayout title={title} isSubpage account={selectedAccount}>
                <WalletSubpageHeading title={title}>{headingAction}</WalletSubpageHeading>

                {!isDeviceConnected && <ConnectDeviceGenericPromo />}

                {children}
            </WalletLayout>
        )}
    />
);
