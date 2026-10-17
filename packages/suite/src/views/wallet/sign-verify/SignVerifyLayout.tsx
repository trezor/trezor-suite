import { type SignVerifyLayoutProps } from '@suite/sign-verify';

import { WalletLayout } from 'src/components/wallet/WalletLayout/WalletLayout';
import { WalletSubpageHeading } from 'src/components/wallet/WalletLayout/WalletSubpageHeading';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

export const SignVerifyLayout = ({
    account,
    title,
    isDeviceConnected,
    children,
}: SignVerifyLayoutProps) => (
    <WalletLayout title={title} isSubpage account={account}>
        <WalletSubpageHeading title={title} />
        {!isDeviceConnected && <ConnectDeviceGenericPromo />}
        {children}
    </WalletLayout>
);
