import { useSelector } from 'react-redux';

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

import { StakingPositionsBottomSheet } from './StakingPositionsBottomSheet';
import { StakingPositionsIcons } from './StakingPositionsIcons';
import { selectStakingListItems } from '../../earnScreenSelectors';

export const StakingPositionsCard = () => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const positions = useSelector(selectStakingListItems);

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
                                <Box flexDirection="row" alignItems="center">
                                    <StakingPositionsIcons />
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
