import React from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type OnSelectAccount } from '@suite-native/accounts';
import { AccountSelectBottomSheet } from '@suite-native/accounts/src/components/AccountSelectBottomSheet';

import { type AssetsRootState, selectBottomSheetDeviceNetworkItems } from '../assetsSelectors';

type NetworkAssetsBottomSheetProps = {
    symbol: NetworkSymbol;
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
            />
        );
    },
);
