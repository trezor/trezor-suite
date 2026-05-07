import { type AccountKey } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { ActiveTokensTab } from './ActiveTokensTab';
import { DefiTokensTab } from './DefiTokensTab';
import { HiddenTokensTab } from './HiddenTokensTab';
import { InactiveTokensTab } from './InactiveTokensTab';
import { type AccountAssetsTab } from './types';

type AccountAssetsTabContentProps = {
    accountKey: AccountKey;
    activeTab: AccountAssetsTab;
};

export const AccountAssetsTabContent = ({
    accountKey,
    activeTab,
}: AccountAssetsTabContentProps) => {
    switch (activeTab) {
        case 'tokens':
            return <ActiveTokensTab accountKey={accountKey} />;
        case 'defi':
            return <DefiTokensTab accountKey={accountKey} />;
        case 'hidden':
            return <HiddenTokensTab accountKey={accountKey} />;
        case 'inactive':
            return <InactiveTokensTab accountKey={accountKey} />;
        default:
            return exhaustive(activeTab);
    }
};
