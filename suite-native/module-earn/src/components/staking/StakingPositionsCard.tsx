import { type NetworkSymbol } from '@suite-common/networks';
import {
    Box,
    Card,
    HStack,
    PressableOpacity,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { StakingPositionsBottomSheet } from './StakingPositionsBottomSheet';
import { StakingPositionsIcons } from './StakingPositionsIcons';
import { type StakingListItem } from '../../types';

const iconsContainerStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    alignItems: 'center',
}));

type StakingPositionsCardProps = {
    symbols: NetworkSymbol[];
    positions: StakingListItem[];
};

export const StakingPositionsCard = ({ symbols, positions }: StakingPositionsCardProps) => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    if (positions.length === 0) return null;

    return (
        <>
            <PressableOpacity onPress={openModal} testID="@earn/staking-card">
                <Card borderColor="borderNeutral">
                    <VStack spacing="sp16">
                        <HStack justifyContent="space-between">
                            <Text variant="body-md">
                                <Translation id="earn.earnScreen.depositsCard.stakingPositions" />
                            </Text>

                            <HStack spacing="sp12" alignItems="center">
                                <Box style={applyStyle(iconsContainerStyle)}>
                                    <StakingPositionsIcons symbols={symbols} />
                                </Box>

                                <Icon
                                    name="caretRight"
                                    size="mediumLarge"
                                    color="contentSecondary"
                                />
                            </HStack>
                        </HStack>
                    </VStack>
                </Card>
            </PressableOpacity>

            <StakingPositionsBottomSheet
                ref={bottomSheetRef}
                positions={positions}
                onClose={closeModal}
            />
        </>
    );
};
