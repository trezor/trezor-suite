import { type ReactNode } from 'react';

import { type SelectedAccountState } from '@suite/account';
import { useDevice } from '@suite/device';
import { type TranslationKey } from '@suite/intl';
import { ConnectDeviceGenericPromo, WalletLayout, WalletSubpageHeading } from '@trezor/suite';

type SignVerifyPageLayoutProps = {
    title: TranslationKey;
    selectedAccount: SelectedAccountState;
    children: ReactNode;
};

export const SignVerifyPageLayout = ({
    title,
    selectedAccount,
    children,
}: SignVerifyPageLayoutProps) => {
    const { device } = useDevice();

    const isDeviceConnected = device?.connected && device?.available;

    return (
        <WalletLayout title={title} isSubpage account={selectedAccount}>
            <WalletSubpageHeading title={title} />

            {!isDeviceConnected && <ConnectDeviceGenericPromo />}

            {children}
        </WalletLayout>
    );
};
