import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { injectGetSignVerify } from '@suite-app/networks';
import { useServices } from '@trezor/dependency-injection';
import {
    ConnectDeviceGenericPromo,
    WalletLayout,
    WalletSubpageHeading,
    useSelector,
} from '@trezor/suite';

export const SignVerifyPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    const { getSignVerify } = useServices(injectGetSignVerify);
    const { device } = useDevice();

    const { account } = selectedAccount;

    if (account === undefined) {
        return null;
    }

    const signVerify = getSignVerify(account);

    // The menu offers Sign & Verify only on networks that have it, so this is reached only by a
    // direct link to the page.
    if (signVerify === null) {
        return null;
    }

    const { Component, title } = signVerify;
    const isDeviceConnected = device?.connected && device?.available;

    return (
        <WalletLayout title={title} isSubpage account={selectedAccount}>
            <WalletSubpageHeading title={title} />

            {!isDeviceConnected && <ConnectDeviceGenericPromo />}

            <Component account={account} />
        </WalletLayout>
    );
};
