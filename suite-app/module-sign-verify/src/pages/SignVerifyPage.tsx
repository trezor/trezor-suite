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
    const { device } = useDevice();
    const { getSignVerify } = useServices(injectGetSignVerify);

    const { account } = selectedAccount;

    if (account === undefined) {
        return null;
    }

    const signVerify = getSignVerify(account);

    if (signVerify === null) {
        return null;
    }

    const isDeviceConnected = device?.connected && device?.available;

    return (
        <WalletLayout title={signVerify.title} isSubpage account={selectedAccount}>
            <WalletSubpageHeading title={signVerify.title} />

            {!isDeviceConnected && <ConnectDeviceGenericPromo />}

            <signVerify.Component key={account.key} account={account} />
        </WalletLayout>
    );
};
