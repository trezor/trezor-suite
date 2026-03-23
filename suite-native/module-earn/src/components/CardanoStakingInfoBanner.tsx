import { useAccoutsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    selectAPYByAccountKey,
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { HELP_CENTER_ADA_STAKING } from '@trezor/urls';

const bannerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundAlertYellowSubtleOnElevation1,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.backgroundAlertYellowSubtleOnElevationNegative,
    borderRadius: utils.borders.radii.r12,
    padding: utils.spacings.sp16,
}));

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    marginTop: utils.spacings.sp12,
    paddingLeft: utils.spacings.sp36,
}));

type CardanoStakingInfoBannerProps = {
    accountKey: AccountKey;
};

export const CardanoStakingInfoBanner = ({ accountKey }: CardanoStakingInfoBannerProps) => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();
    const apy = useNativeStakingSelector(state => selectAPYByAccountKey(state, accountKey));

    const isStakedWithFiveBinaries = useAccoutsSelector(state =>
        selectIsCardanoStakedWithFiveBinaries(state, accountKey),
    );

    const isStakedOutsideEverstake = useNativeStakingSelector(state =>
        selectIsCardanoStakedOutsideEverstake(state, accountKey),
    );

    if (!isStakedWithFiveBinaries && !isStakedOutsideEverstake) {
        return null;
    }

    const apyValue = apy ?? <Translation id="earn.notAvailableShort" />;
    const descriptionTranslationId = isStakedWithFiveBinaries
        ? 'earn.infoBanner.providerReducingRewards'
        : 'earn.infoBanner.updateToNewProvider';

    const handleUpdateProviderPress = () => {
        openLink(`${HELP_CENTER_ADA_STAKING}#migrating-staking-pools`);
    };

    return (
        <Box style={applyStyle(bannerStyle)}>
            <HStack spacing="sp12" alignItems="flex-start">
                <Icon name="warning" color="iconAlertYellow" size="mediumLarge" />

                <VStack spacing="sp2" flex={1}>
                    <Text variant="body-md">
                        <Translation id="earn.infoBanner.updateProviderTitle" />
                    </Text>
                    <Text variant="body-sm" color="textSubdued">
                        <Translation id={descriptionTranslationId} values={{ apy: apyValue }} />
                    </Text>
                </VStack>
            </HStack>

            <Box style={applyStyle(buttonWrapperStyle)}>
                <Button
                    colorScheme="yellowBold"
                    onPress={handleUpdateProviderPress}
                    isFullWidth
                    size="small"
                >
                    <Text variant="body-sm-strong" color="textOnYellow">
                        <Translation id="earn.infoBanner.updateProviderButton" />
                    </Text>
                </Button>
            </Box>
        </Box>
    );
};
