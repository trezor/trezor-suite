import type { ComponentType } from 'react';

import type { TranslationKey } from '@suite/intl';
import type { Account } from '@suite-common/wallet-types';

export type SignVerifyProps = {
    account: Account;
};

export type SignVerifyModule = {
    Component: ComponentType<SignVerifyProps>;

    /** Networks that cannot verify say so in the page heading. */
    title: TranslationKey;
};
