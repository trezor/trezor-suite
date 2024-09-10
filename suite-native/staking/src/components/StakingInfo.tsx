import { useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@suite-common/icons';
import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { StakingBottomSheet } from './StakingBottomSheet';
import { StakePendingCard } from './StakePendingCard';
import { StakingBalancesCard } from './StakingBalancesCard';

const sectiontStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.small,
    paddingVertical: utils.spacings.large,
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

    const handleToggleBottomSheet = useCallback(
        (isSelected: boolean) => {
            setIsCardSelected(isSelected);
        },
        [setIsCardSelected],
    );

    return (
        <Box style={applyStyle(sectiontStyle)}>
            <StakePendingCard
                accountKey={accountKey}
                handleToggleBottomSheet={handleToggleBottomSheet}
            />

            <StakingBalancesCard
                accountKey={accountKey}
                handleToggleBottomSheet={handleToggleBottomSheet}
            />

            <Box marginTop="extraLarge" alignItems="center">
                <Icon name="desktop" color="textSubdued" size="extraLarge" />

                <Box justifyContent="center" alignItems="center" marginTop="small">
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

            <StakingBottomSheet
                isCardSelected={isCardSelected}
                handleToggleBottomSheet={handleToggleBottomSheet}
                handleDesktopClick={handleDesktopClick}
            />
        </Box>
    );
};
