import { type ReactNode } from 'react';

import { type SelectedAccountStatus } from '@suite-common/wallet-types';
import { type TranslationKey } from '@suite-lego/intl';

export type SignVerifyLayoutProps = {
    account: SelectedAccountStatus;
    title: TranslationKey;
    isDeviceConnected: boolean;
    children: ReactNode;
};
