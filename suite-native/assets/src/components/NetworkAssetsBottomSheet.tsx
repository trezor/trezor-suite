import React from 'react';
import { useSelector } from 'react-redux';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { OnSelectAccount } from '@suite-native/accounts';
import { AccountSelectBottomSheet } from '@suite-native/accounts/src/components/AccountSelectBottomSheet';

import { AssetsRootState, selectBottomSheetDeviceNetworkItems } from '../assetsSelectors';

type NetworkAssetsBottomSheetProps = {
    networkSymbol: NetworkSymbol;
    onSelectAccount: OnSelectAccount;
    onClose: () => void;
};

export const NetworkAssetsBottomSheet = React.memo(
    ({ networkSymbol, onSelectAccount, onClose }: NetworkAssetsBottomSheetProps) => {
        const items = useSelector((state: AssetsRootState) =>
            selectBottomSheetDeviceNetworkItems(state, networkSymbol),
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
