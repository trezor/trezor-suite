import { useMemo } from 'react';
import { Pressable } from 'react-native';

import { type OtcProviderType } from '@suite-common/trading';
import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { BottomSheetSectionList, type SectionListData } from '@suite-native/trading-atoms';

import { SimpleSheetHeader } from '../general/SimpleSheetHeader';

type ConciergeProviderSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    providers: OtcProviderType[];
    onProviderSelect: (provider: OtcProviderType) => void;
    testID?: string;
};

type ConciergeProviderListItemProps = {
    provider: OtcProviderType;
    onPress: () => void;
};

const ESTIMATED_ITEM_HEIGHT = 64;

const keyExtractor = (item: OtcProviderType) => item.url;

const ConciergeProviderListItem = ({ provider, onPress }: ConciergeProviderListItemProps) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={provider.name}>
        <Box paddingVertical="sp20" justifyContent="center" paddingHorizontal="sp8">
            <Text variant="body-md" color="contentPrimary" numberOfLines={1} ellipsizeMode="tail">
                {provider.name}
            </Text>
        </Box>
    </Pressable>
);

export const ConciergeProviderSheet = ({
    isVisible,
    onClose,
    providers,
    onProviderSelect,
    testID,
}: ConciergeProviderSheetProps) => {
    const data = useMemo<SectionListData<OtcProviderType>>(
        () => [
            {
                key: 'providers',
                label: null,
                sectionData: undefined,
                data: providers,
            },
        ],
        [providers],
    );

    const estimatedListHeight = useMemo(
        () => providers.length * ESTIMATED_ITEM_HEIGHT,
        [providers.length],
    );

    return (
        <BottomSheetSectionList<OtcProviderType>
            estimatedListHeight={estimatedListHeight}
            isVisible={isVisible}
            onClose={onClose}
            handleComponent={() => (
                <SimpleSheetHeader
                    onClose={onClose}
                    title={<Translation id="moduleTrading.tradingScreen.provider" />}
                />
            )}
            renderItem={item => (
                <ConciergeProviderListItem provider={item} onPress={() => onProviderSelect(item)} />
            )}
            data={data}
            keyExtractor={keyExtractor}
            noSingletonSectionHeader
            testID={testID}
        />
    );
};
