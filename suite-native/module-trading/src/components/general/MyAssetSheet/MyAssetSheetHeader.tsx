import { useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    FOCUS_ANIMATION_DURATION,
    SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
    SearchableSheetHeader,
} from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { MyAssetFilterTabs } from './MyAssetFilterTabs';

type MyAssetSheetHeaderProps = {
    onClose: () => void;
    onFilterChange: (value: string) => void;
    onSelectedNetworkFilter: (symbol: NetworkSymbol | undefined) => void;
    availableNetworks: NetworkSymbol[];
    testID?: string;
};

const wrapperStyle = prepareNativeStyle(() => ({
    height: SEARCHABLE_SHEET_HEADER_DEFAULT_HEIGHT,
}));

export const MyAssetSheetHeader = ({
    onClose,
    onFilterChange,
    onSelectedNetworkFilter,
    availableNetworks,
    testID,
}: MyAssetSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const [isFilterActive, setIsFilterActive] = useState(false);

    const searchInputTestId = testID ? `${testID}/search-input` : undefined;

    return (
        <SearchableSheetHeader
            onClose={onClose}
            title={<Translation id="moduleTrading.myAssetSheet.title" />}
            onFilterFocusChange={setIsFilterActive}
            onFilterChange={onFilterChange}
            style={applyStyle(wrapperStyle)}
            searchInputTestId={searchInputTestId}
            searchInputPlaceholder={translate('moduleTrading.myAssetSheet.searchInputPlaceholder')}
            autoCorrect={false}
        >
            <Animated.View
                layout={LinearTransition.duration(FOCUS_ANIMATION_DURATION)}
                testID={testID}
            >
                <MyAssetFilterTabs
                    isVisible={isFilterActive}
                    animationDuration={FOCUS_ANIMATION_DURATION}
                    onSelectedNetworkFilter={onSelectedNetworkFilter}
                    availableNetworks={availableNetworks}
                />
            </Animated.View>
        </SearchableSheetHeader>
    );
};
