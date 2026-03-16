import React from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AccountSelectBottomSheet, type OnSelectAccount } from '@suite-native/accounts';

import { type AssetsRootState, selectBottomSheetDeviceNetworkItems } from '../assetsSelectors';

type NetworkAssetsBottomSheetProps = {
    symbol: NetworkSymbol | null;
    onSelectAccount: OnSelectAccount;
    onClose: () => void;
};

export const NetworkAssetsBottomSheet = React.memo(
    ({ symbol, onSelectAccount, onClose }: NetworkAssetsBottomSheetProps) => {
        const items = useSelector((state: AssetsRootState) =>
            selectBottomSheetDeviceNetworkItems(state, symbol),
        );

        return (
            <AccountSelectBottomSheet
                data={items}
                onClose={onClose}
                onSelectAccount={onSelectAccount}
                isStakingPressable
                isVisible={Boolean(symbol && items.length)}
            />
        );
    },
);
