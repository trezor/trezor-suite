import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { SignVerify } from '@suite/sign-verify';
import { injectSignVerify } from '@suite-common/sign-verify';
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
    const { signVerify } = useServices(injectSignVerify);

    const { account } = selectedAccount;

    if (account === undefined) {
        return null;
    }

    const title = signVerify.isVerifySupported(account) ? 'TR_NAV_SIGN_VERIFY' : 'TR_SIGN_MESSAGE';
    const isDeviceConnected = device?.connected && device?.available;

    return (
        <WalletLayout title={title} isSubpage account={selectedAccount}>
            <WalletSubpageHeading title={title} />

            {!isDeviceConnected && <ConnectDeviceGenericPromo />}

            <SignVerify account={account} network={selectedAccount.network} />
        </WalletLayout>
    );
};
