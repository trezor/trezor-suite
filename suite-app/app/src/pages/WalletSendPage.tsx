import { selectFullSelectedAccount } from '@suite/account';
import { selectRouteName } from '@suite/router';
import { SendForm, WalletLayout, useSelector } from '@trezor/suite';

export const WalletSendPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const currentRoute = useSelector(selectRouteName);

    // Account selection and the route can temporarily disagree during navigation.
    if (selectedAccount.status !== 'loaded' || currentRoute !== 'wallet-send') {
        return <WalletLayout title="TR_NAV_SEND" account={selectedAccount} />;
    }

    return <SendForm selectedAccount={selectedAccount} />;
};
