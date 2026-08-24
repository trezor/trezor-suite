import { type ReactNode, useState } from 'react';

import { useDevice } from '@suite/device';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { SignVerifyForm, type SignVerifyPage } from './SignVerifyForm';
import { isVerifySupported } from './signVerifyActions';

type SignVerifyShellProps = {
    title: 'TR_NAV_SIGN_VERIFY' | 'TR_SIGN_MESSAGE';
    isDeviceConnected: boolean | undefined;
    children: ReactNode;
};

type SignVerifyProps = {
    account: Account;
    network?: Network;
    renderShell: (props: SignVerifyShellProps) => ReactNode;
};

export const SignVerify = ({ account, network, renderShell }: SignVerifyProps) => {
    const [page, setPage] = useState<SignVerifyPage>('sign');
    const { device } = useDevice();

    return renderShell({
        title: isVerifySupported(account) ? 'TR_NAV_SIGN_VERIFY' : 'TR_SIGN_MESSAGE',
        isDeviceConnected: device?.connected && device?.available,
        children: (
            // Each tab is a form of its own: keying it on the page throws away everything the
            // other one was in the middle of, including the outcome it had reached.
            <SignVerifyForm
                key={page}
                account={account}
                network={network}
                page={page}
                onPageChange={setPage}
            />
        ),
    });
};
