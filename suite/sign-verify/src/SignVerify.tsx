import { type ReactNode, useState } from 'react';

import { useDevice } from '@suite/device';
import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { SignVerifyForm } from './SignVerifyForm';
import { isVerifySupported } from './signVerifyActions';
import { type SignVerifyPage } from './types';

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
            // Each tab of each account is a form of its own: keying it throws away everything the
            // previous one was in the middle of, including the outcome it had reached.
            <SignVerifyForm
                key={`${page}-${account.key}`}
                account={account}
                network={network}
                page={page}
                onPageChange={setPage}
            />
        ),
    });
};
