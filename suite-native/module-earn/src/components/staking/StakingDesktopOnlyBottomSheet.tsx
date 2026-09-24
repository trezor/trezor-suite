import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    PressableOpacity,
    Text,
    TitleHeader,
} from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation, useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { SUITE_URL } from '@trezor/urls';

import { StakingPromoRingIcon } from './StakingPromoRingIcon';

const clipboardContainerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillBrandSofter,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    marginTop: utils.spacings.sp24,
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.elementBorderBrandSofter,
    borderRadius: utils.borders.radii.r12,
}));

type StakingDesktopOnlyBottomSheetProps = {
    ref: BottomSheetModalRef;
};

export const StakingDesktopOnlyBottomSheet = ({ ref }: StakingDesktopOnlyBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();
    const copyToClipboard = useCopyToClipboard();

    const earnType = translate('earn.staking');
    const formattedUrl = SUITE_URL.replace('https://', 'www.');

    const onCopyPress = () => {
        copyToClipboard(formattedUrl);
    };

    return (
        <BottomSheetModal ref={ref}>
            <Box alignItems="center">
                <StakingPromoRingIcon iconName="piggyBank" />

                <TitleHeader
                    titleVariant="headline-sm"
                    title={
                        <Translation id="earn.earnScreen.infoModal.title" values={{ earnType }} />
                    }
                    subtitle={<Translation id="earn.earnScreen.infoModal.subtitle" />}
                    textAlign="center"
                />

                <PressableOpacity style={applyStyle(clipboardContainerStyle)} onPress={onCopyPress}>
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
