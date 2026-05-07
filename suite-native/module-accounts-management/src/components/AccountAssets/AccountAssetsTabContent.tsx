import { type AccountKey } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { type AccountAssetsTab } from './AccountAssetsTabBar';
import { ActiveTokensTab } from './ActiveTokensTab';
import { DefiTokensTab } from './DefiTokensTab';
import { HiddenTokensTab } from './HiddenTokensTab';

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
        default:
            return exhaustive(activeTab);
    }
};
