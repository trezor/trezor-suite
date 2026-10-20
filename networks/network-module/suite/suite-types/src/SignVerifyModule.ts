import type { ComponentType } from 'react';

import type { Account } from '@suite-common/wallet-types';

export type SignVerifyProps = {
    account: Account;
    isDeviceLocked: boolean;
};

export type SignVerifyModule = {
    Component: ComponentType<SignVerifyProps>;

    /** Networks that cannot verify say so in the page heading. */
    canVerify: boolean;
};
