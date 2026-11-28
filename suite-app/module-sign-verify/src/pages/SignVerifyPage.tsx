import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { useServices } from '@trezor/dependency-injection';
import { injectGetSignVerify } from '@trezor/network-module-suite-types';
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

    const signVerify = getSignVerify(account.symbol);

    if (signVerify === null) {
        return null;
    }

    const isDeviceConnected = device?.connected && device?.available;

    return (
        <WalletLayout title={signVerify.title} isSubpage account={selectedAccount}>
            <WalletSubpageHeading title={signVerify.title} />

            {!isDeviceConnected && <ConnectDeviceGenericPromo />}

            <signVerify.Component
                key={account.key}
                networkSymbol={account.symbol}
                account={account}
            />
        </WalletLayout>
    );
};
