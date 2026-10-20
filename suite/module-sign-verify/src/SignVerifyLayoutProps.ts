import { type ReactNode } from 'react';

import { type SelectedAccountStatus } from '@suite-common/wallet-types';

export type SignVerifyLayoutProps = {
    account: SelectedAccountStatus;
    title: 'TR_NAV_SIGN_VERIFY' | 'TR_SIGN_MESSAGE';
    isDeviceConnected: boolean;
    children: ReactNode;
};
