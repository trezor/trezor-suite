import { useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { StakePendingCard } from './StakePendingCard';
import { StakingBalancesOverviewCard } from './StakingBalancesOverviewCard';
import { StakingUnavailableBottomSheet } from './StakingUnavailableBottomSheet';

const sectionStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp8,
    paddingVertical: utils.spacings.sp24,
    flex: 1,
}));

const linkStyle = prepareNativeStyle(() => ({
    textDecorationLine: 'underline',
}));

type StakingInfoProps = {
    accountKey: string;
};

export const StakingInfo = ({ accountKey }: StakingInfoProps) => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();

    const [isCardSelected, setIsCardSelected] = useState<boolean>(false);

    const handleDesktopClick = () => {
        openLink('https://trezor.io/trezor-suite');
    };

    const handleToggleBottomSheet = useCallback(() => {
        setIsCardSelected(prev => !prev);
    }, [setIsCardSelected]);

    return (
        <Box style={applyStyle(sectionStyle)}>
            <StakePendingCard
                accountKey={accountKey}
                handleToggleBottomSheet={handleToggleBottomSheet}
            />

            <StakingBalancesOverviewCard
                accountKey={accountKey}
                handleToggleBottomSheet={handleToggleBottomSheet}
            />

            <Box marginTop="sp32" alignItems="center">
                {/* TODO: replace with new icon once we have new package ready */}
                {/* <Icon name="desktop" color="textSubdued" size="extraLarge" /> */}

                <Box justifyContent="center" alignItems="center" marginTop="sp8">
                    <Text color="textSubdued" textAlign="center">
                        <Translation id="staking.stakingCanBeManaged" />
                    </Text>

                    <TouchableOpacity onPress={handleDesktopClick}>
                        <Text color="textSubdued" style={applyStyle(linkStyle)}>
                            <Translation id="staking.trezorDesktop" />
                        </Text>
                    </TouchableOpacity>
                </Box>
            </Box>

            <StakingUnavailableBottomSheet
                isCardSelected={isCardSelected}
                handleToggleBottomSheet={handleToggleBottomSheet}
                handleDesktopClick={handleDesktopClick}
            />
        </Box>
    );
};
