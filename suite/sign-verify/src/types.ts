import type { ReactNode } from 'react';

import type { Network } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';

export type SignVerifyShellProps = {
    title: 'TR_NAV_SIGN_VERIFY' | 'TR_SIGN_MESSAGE';
    isDeviceConnected: boolean | undefined;
    headingAction: ReactNode;
    children: ReactNode;
};

export type SignVerifyProps = {
    account: Account;
    network?: Network;
    renderShell: (props: SignVerifyShellProps) => ReactNode;
};
