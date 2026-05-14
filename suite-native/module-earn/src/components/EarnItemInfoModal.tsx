import React from 'react';

import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    PressableOpacity,
    Text,
    TitleHeader,
} from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { type IconName } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { SUITE_URL } from '@trezor/urls';

import { StakingPromoRingIcon } from './StakingPromoRingIcon';

export type EarnType = 'staking' | 'stablecoin-yield';
type EarnItemInfoModalProps = {
    ref: BottomSheetModalRef;
    type?: EarnType;
};

const clipboardContainerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.legacyBackgroundPrimarySubtleOnElevation1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    marginTop: utils.spacings.sp24,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.legacyBackgroundPrimarySubtleOnElevationNegative,
    borderRadius: utils.borders.radii.r12,
}));

const iconByEarnType: Record<EarnType, IconName> = {
    staking: 'piggyBank',
    'stablecoin-yield': 'coins',
};

const earnTypeTranslationIdByType = {
    staking: 'earn.staking',
    'stablecoin-yield': 'earn.stablecoinYield',
} as const;

export const EarnItemInfoModal = ({ ref, type = 'staking' }: EarnItemInfoModalProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const copyToClipboard = useCopyToClipboard();
    const formattedUrl = SUITE_URL.replace('https://', 'www.');

    const earnType = translate(earnTypeTranslationIdByType[type]);

    return (
        <BottomSheetModal ref={ref}>
            <Box alignItems="center">
                <StakingPromoRingIcon iconName={iconByEarnType[type]} />
                <TitleHeader
                    titleVariant="headline-sm"
                    title={
                        <Translation id="earn.earnScreen.infoModal.title" values={{ earnType }} />
                    }
                    subtitle={<Translation id="earn.earnScreen.infoModal.subtitle" />}
                    textAlign="center"
                />
                <PressableOpacity
                    style={applyStyle(clipboardContainerStyle)}
                    onPress={() => copyToClipboard(formattedUrl)}
                >
                    <Text textAlign="center" variant="body-sm" color="contentSecondary">
                        <Translation id="earn.earnScreen.infoModal.copyLabel" />
                    </Text>
                    <Text variant="body-md-strong" color="contentBrand">
                        {formattedUrl}
                    </Text>
                </PressableOpacity>
            </Box>
        </BottomSheetModal>
    );
};
