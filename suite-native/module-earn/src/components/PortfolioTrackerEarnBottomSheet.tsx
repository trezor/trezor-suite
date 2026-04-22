import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    PressableOpacity,
    Text,
    TitleHeader,
    VStack,
} from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { SUITE_URL } from '@trezor/urls';

type PortfolioTrackerEarnBottomSheetProps = {
    bottomSheetRef: BottomSheetModalRef;
    onClose: () => void;
};

const contentStyle = prepareNativeStyle(utils => ({
    gap: utils.spacings.sp24,
    marginHorizontal: utils.spacings.sp8,
}));

const urlBoxStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.legacyBackgroundPrimarySubtleOnElevation1,
    width: '100%',
    paddingVertical: utils.spacings.sp12,
    alignItems: 'center',
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.legacyBackgroundPrimarySubtleOnElevationNegative,
    borderRadius: utils.borders.radii.r12,
    gap: utils.spacings.sp4,
}));

export const PortfolioTrackerEarnBottomSheet = ({
    bottomSheetRef,
    onClose,
}: PortfolioTrackerEarnBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();
    const formattedUrl = SUITE_URL.replace('https://', 'www.');

    return (
        <BottomSheetModal ref={bottomSheetRef}>
            <Box style={applyStyle(contentStyle)}>
                <VStack spacing="sp16" alignItems="center">
                    <TitleHeader
                        titleVariant="headline-sm"
                        title={<Translation id="earn.portfolioTracker.alert.title" />}
                        subtitle={<Translation id="earn.portfolioTracker.alert.description" />}
                        textAlign="center"
                    />
                    <PressableOpacity
                        onPress={() => copyToClipboard(formattedUrl)}
                        style={applyStyle(urlBoxStyle)}
                    >
                        <Text variant="body-sm" color="contentSecondary">
                            <Translation id="earn.portfolioTracker.alert.copyLabel" />
                        </Text>
                        <Text variant="body-md-strong" color="contentBrand">
                            {formattedUrl}
                        </Text>
                    </PressableOpacity>
                </VStack>
                <Button onPress={onClose}>
                    <Translation id="generic.buttons.gotIt" />
                </Button>
            </Box>
        </BottomSheetModal>
    );
};
