import { type ReactElement } from 'react';

import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

export type { AccountOverviewFlow, AccountOverviewTab } from '@suite-native/navigation';

export type OnSelectAsset = (params: {
    tokenContract?: TokenAddress;
    tokenSymbol?: TokenSymbol;
}) => void;

export type AccountAssetsTabListProps = {
    ListHeaderComponent?: ReactElement;
};
