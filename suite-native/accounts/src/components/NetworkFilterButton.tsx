import { useRef } from 'react';
import { Keyboard, View } from 'react-native';
import { useSelector } from 'react-redux';

import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { IconButton } from '@suite-native/atoms';
import { type NetworkSymbol } from '@trezor/network-module-types';

import {
    type NativeAccountsWithNetworksRootState,
    selectIsAccountsListNetworkFilterVisible,
} from '../selectors';
import { type NetworkFilterType } from '../types';
import { FilterCountBadge } from './FilterCountBadge';
import { NetworkFilterBottomSheet } from './NetworkFilterBottomSheet';

export type NetworkFilter = {
    type: NetworkFilterType;
    filteredNetworks: NetworkSymbol[];
    setFilteredNetworks: (networkSymbols: NetworkSymbol[]) => void;
};

type NetworkFilterButtonProps = {
    filter: NetworkFilter;
    onPress?: () => void;
};

export const NetworkFilterButton = ({
    filter: { type, filteredNetworks, setFilteredNetworks },
    onPress,
}: NetworkFilterButtonProps) => {
    const filterBottomSheetRef = useRef<BottomSheetModalMethods>(null);

    const isNetworkFilterVisible = useSelector((state: NativeAccountsWithNetworksRootState) =>
        selectIsAccountsListNetworkFilterVisible(state, type),
    );

    if (!isNetworkFilterVisible) {
        return null;
    }

    const openFilterBottomSheet = () => {
        Keyboard.dismiss();
        filterBottomSheetRef.current?.present();
        onPress?.();
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
                type={type}
            />
        </>
    );
};
