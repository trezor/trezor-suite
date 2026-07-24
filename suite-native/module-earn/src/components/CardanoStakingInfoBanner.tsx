import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import {
    selectApy,
    selectIsCardanoStakedOutsideEverstake,
    selectIsCardanoStakedWithFiveBinaries,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { HELP_CENTER_ADA_STAKING } from '@trezor/urls';

const bannerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillWarningSofter,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.elementBorderWarningSofter,
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

    const isStakedWithFiveBinaries = useAccountsSelector(state =>
        selectIsCardanoStakedWithFiveBinaries(state, accountKey),
    );

    const isStakedOutsideEverstake = useNativeStakingSelector(state =>
        selectIsCardanoStakedOutsideEverstake(state, accountKey),
    );

    const networkSymbol = useAccountsSelector(state =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    // Promoted (best) pool APY to switch to, not the account's own APY.
    const apy = useNativeStakingSelector(state =>
        selectApy(state, { networkSymbol: networkSymbol ?? undefined }),
    );

    if (!isStakedWithFiveBinaries && !isStakedOutsideEverstake) {
        return null;
    }

    const apyValue = apy ?? <Translation id="earn.notAvailableShort" />;
    const displaySymbol = networkSymbol ? getNetworkDisplaySymbol(networkSymbol) : '';

    // Staking with 5 Binaries earns almost nothing, so the heading urges migration. Staking with
    // any other provider is fine, so it just promotes the new provider (matching desktop).
    const titleTranslationId = isStakedWithFiveBinaries
        ? 'earn.infoBanner.updateProviderTitle'
        : 'earn.infoBanner.newProviderTitle';
    const descriptionTranslationId = isStakedWithFiveBinaries
        ? 'earn.infoBanner.providerReducingRewards'
        : 'earn.infoBanner.updateToNewProvider';

    const handleUpdateProviderPress = () => {
        openLink(`${HELP_CENTER_ADA_STAKING}#migrating-staking-pools`);
    };

    return (
        <Box style={applyStyle(bannerStyle)}>
            <HStack spacing="sp12" alignItems="flex-start">
                <Icon name="warning" color="contentWarning" size="mediumLarge" />

                <VStack spacing="sp2" flex={1}>
                    <Text variant="body-md">
                        <Translation id={titleTranslationId} values={{ apy: apyValue }} />
                    </Text>
                    <Text variant="body-sm" color="contentSecondary">
                        <Translation
                            id={descriptionTranslationId}
                            values={{ apy: apyValue, symbol: displaySymbol }}
                        />
                    </Text>
                </VStack>
            </HStack>

            <Box style={applyStyle(buttonWrapperStyle)}>
                <Button
                    intent="warning"
                    priority="primary"
                    onPress={handleUpdateProviderPress}
                    isFullWidth
                    size="medium"
                >
                    <Text variant="body-sm-strong" color="contentButtonWarningPrimary">
                        <Translation id="earn.infoBanner.updateProviderButton" />
                    </Text>
                </Button>
            </Box>
        </Box>
    );
};
