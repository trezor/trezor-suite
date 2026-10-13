import { useRef } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { type NetworksRootState } from '@suite-common/networks';
import { IconButton } from '@suite-native/atoms';
import type { NetworkSymbol } from '@trezor/network-module-types';

import {
    type NativeAccountsRootState,
    selectIsAccountsListNetworkFilterVisible,
} from '../selectors';
import { FilterCountBadge } from './FilterCountBadge';
import { NetworkFilterBottomSheet } from './NetworkFilterBottomSheet';

export type NetworkFilter = {
    filteredNetworks: NetworkSymbol[];
    setFilteredNetworks: (networkSymbols: NetworkSymbol[]) => void;
};

type NetworkFilterButtonProps = {
    filter: NetworkFilter;
    isSendFlow?: boolean;
};

export const NetworkFilterButton = ({
    filter: { filteredNetworks, setFilteredNetworks },
    isSendFlow,
}: NetworkFilterButtonProps) => {
    const filterBottomSheetRef = useRef<BottomSheetModalMethods>(null);

    const isNetworkFilterVisible = useSelector(
        (state: NativeAccountsRootState & NetworksRootState) =>
            selectIsAccountsListNetworkFilterVisible(state, isSendFlow),
    );

    if (!isNetworkFilterVisible) {
        return null;
    }

    const openFilterBottomSheet = () => {
        filterBottomSheetRef.current?.present();
    };

    return (
        <>
            <View>
                <IconButton
                    iconName="funnelSimple"
                    size="medium"
                    onPress={openFilterBottomSheet}
                    intent="neutral"
                    priority="secondary"
                    testID="@myAssets/networkFilterButton"
                />
                {filteredNetworks.length > 0 && (
                    <FilterCountBadge count={filteredNetworks.length} />
                )}
            </View>
            <NetworkFilterBottomSheet
                ref={filterBottomSheetRef}
                selectedNetworks={filteredNetworks}
                onApply={selected => setFilteredNetworks(selected)}
                onClear={() => setFilteredNetworks([])}
                isSendFlow={isSendFlow}
            />
        </>
    );
};
