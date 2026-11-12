import { type ReactNode } from 'react';

import { useDevice } from '@suite/device';
import { isVerifySupported } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';

import { CardanoSignVerify } from './networks/CardanoSignVerify';
import { EthereumSignVerify } from './networks/EthereumSignVerify';

type SignVerifyShellProps = {
    title: 'TR_NAV_SIGN_VERIFY' | 'TR_SIGN_MESSAGE';
    isDeviceConnected: boolean | undefined;
    children: ReactNode;
};

type SignVerifyProps = {
    account: Account;
    renderShell: (props: SignVerifyShellProps) => ReactNode;
};

/**
 * Picks the form of a network that has no network module yet. Only the networks offering
 * Sign & Verify reach this page.
 */
export const SignVerify = ({ account, renderShell }: SignVerifyProps) => {
    const { device } = useDevice();

    return renderShell({
        title: isVerifySupported(account) ? 'TR_NAV_SIGN_VERIFY' : 'TR_SIGN_MESSAGE',
        isDeviceConnected: device?.connected && device?.available,
        children: (
            <>
                {account.networkType === 'ethereum' && <EthereumSignVerify account={account} />}
                {account.networkType === 'cardano' && <CardanoSignVerify account={account} />}
            </>
        ),
    });
};
