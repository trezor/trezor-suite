import { BottomSheetModal, type BottomSheetModalRef, Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const bottomSheetElementStyle = prepareNativeStyle(utils => ({
    marginVertical: utils.spacings.sp8,
}));

type StakingUnavailableBottomSheet = {
    onClose: () => void;
    handleDesktopClick: () => void;
    ref: BottomSheetModalRef;
};

export const StakingUnavailableBottomSheet = ({
    onClose,
    handleDesktopClick,
    ref,
}: StakingUnavailableBottomSheet) => {
    const { applyStyle } = useNativeStyles();

    return (
        <BottomSheetModal
            ref={ref}
            title={
                <Text variant="headline-sm" textAlign="center">
                    <Translation id="earn.stakingBottomSheet.title" />
                </Text>
            }
            paddingHorizontal="sp24"
        >
            <Text
                color="textSubdued"
                textAlign="center"
                style={applyStyle(bottomSheetElementStyle)}
            >
                <Translation id="earn.stakingBottomSheet.description" />
            </Text>

            <Button onPress={onClose} style={applyStyle(bottomSheetElementStyle)}>
                <Translation id="generic.buttons.gotIt" />
            </Button>

            <Button
                colorScheme="tertiaryElevation0"
                onPress={handleDesktopClick}
                viewLeft="arrowSquareOut"
                style={applyStyle(bottomSheetElementStyle)}
            >
                <Translation id="earn.trezorDesktop" />
            </Button>
        </BottomSheetModal>
    );
};
