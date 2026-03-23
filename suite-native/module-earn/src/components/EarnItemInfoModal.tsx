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
import { Icon, type IconName } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { SUITE_URL } from '@trezor/urls';

export type EarnType = 'staking' | 'stablecoin-yield';
type EarnItemInfoModalProps = {
    ref: BottomSheetModalRef;
    type?: EarnType;
};

const clipboardContainerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundPrimarySubtleOnElevation1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    marginTop: utils.spacings.sp24,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.backgroundPrimarySubtleOnElevationNegative,
    borderRadius: utils.borders.radii.r12,
}));

const iconInnerContainerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundPrimarySubtleOnElevation1,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: utils.borders.radii.round,
}));

const iconOuterContainerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundPrimarySubtleOnElevationNegative,
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: utils.borders.radii.round,
    marginBottom: utils.spacings.sp20,
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
                <Box style={applyStyle(iconOuterContainerStyle)}>
                    <Box style={applyStyle(iconInnerContainerStyle)}>
                        <Icon
                            size={40}
                            name={iconByEarnType[type]}
                            color="backgroundPrimaryDefault"
                        />
                    </Box>
                </Box>
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
                    <Text textAlign="center" variant="body-sm" color="textSubdued">
                        <Translation id="earn.earnScreen.infoModal.copyLabel" />
                    </Text>
                    <Text variant="body-md-strong" color="textPrimaryDefault">
                        {formattedUrl}
                    </Text>
                </PressableOpacity>
            </Box>
        </BottomSheetModal>
    );
};
