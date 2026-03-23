import { type AccountKey } from '@suite-common/wallet-types';
import { Box, PressableOpacity, Text, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { SUITE_URL } from '@trezor/urls';

import { CardanoStakingInfoBanner } from './CardanoStakingInfoBanner';
import { StakeClaimableCard } from './StakeClaimableCard';
import { StakePendingCard } from './StakePendingCard';
import { StakingBalancesOverviewCard } from './StakingBalancesOverviewCard';
import { StakingUnavailableBottomSheet } from './StakingUnavailableBottomSheet';

const sectionStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp8,
    paddingVertical: utils.spacings.sp24,
    flex: 1,
    gap: utils.spacings.sp16,
}));

const linkStyle = prepareNativeStyle(() => ({
    textDecorationLine: 'underline',
}));

type StakingInfoProps = {
    accountKey: AccountKey;
};

export const StakingInfo = ({ accountKey }: StakingInfoProps) => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const handleDesktopClick = () => {
        openLink(SUITE_URL);
    };

    return (
        <Box style={applyStyle(sectionStyle)}>
            <StakePendingCard accountKey={accountKey} handleToggleBottomSheet={openModal} />

            <StakeClaimableCard accountKey={accountKey} handleToggleBottomSheet={openModal} />

            <CardanoStakingInfoBanner accountKey={accountKey} />

            <StakingBalancesOverviewCard
                accountKey={accountKey}
                handleToggleBottomSheet={openModal}
            />

            <Box marginTop="sp16" alignItems="center">
                {/* TODO: replace with new icon once we have new package ready */}
                {/* <Icon name="desktop" color="textSubdued" size="extraLarge" /> */}

                <Box justifyContent="center" alignItems="center" marginTop="sp8">
                    <Text color="textSubdued" textAlign="center">
                        <Translation id="earn.stakingCanBeManaged" />
                    </Text>

                    <PressableOpacity onPress={handleDesktopClick}>
                        <Text color="textSubdued" style={applyStyle(linkStyle)}>
                            <Translation id="earn.trezorDesktop" />
                        </Text>
                    </PressableOpacity>
                </Box>
            </Box>

            <StakingUnavailableBottomSheet
                ref={bottomSheetRef}
                onClose={closeModal}
                handleDesktopClick={handleDesktopClick}
            />
        </Box>
    );
};
