import { BottomSheet, Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const bottomSheetElementStyle = prepareNativeStyle(utils => ({
    marginVertical: utils.spacings.sp8,
}));

type StakingUnavailableBottomSheet = {
    isCardSelected: boolean;
    handleToggleBottomSheet: () => void;
    handleDesktopClick: () => void;
};

export const StakingUnavailableBottomSheet = ({
    isCardSelected,
    handleToggleBottomSheet,
    handleDesktopClick,
}: StakingUnavailableBottomSheet) => {
    const { applyStyle } = useNativeStyles();

    if (!isCardSelected) return null;

    return (
        <BottomSheet
            title={
                <Text variant="titleSmall" textAlign="center">
                    <Translation id="staking.stakingBottomSheet.title" />
                </Text>
            }
            isVisible
            isCloseDisplayed={false}
            onClose={handleToggleBottomSheet}
            paddingHorizontal="sp24"
        >
            <Text
                color="textSubdued"
                textAlign="center"
                style={applyStyle(bottomSheetElementStyle)}
            >
                <Translation id="staking.stakingBottomSheet.description" />
            </Text>

            <Button onPress={handleToggleBottomSheet} style={applyStyle(bottomSheetElementStyle)}>
                <Translation id="generic.buttons.gotIt" />
            </Button>

            <Button
                colorScheme="tertiaryElevation0"
                onPress={handleDesktopClick}
                viewLeft="arrowSquareOut"
                style={applyStyle(bottomSheetElementStyle)}
            >
                <Translation id="staking.trezorDesktop" />
            </Button>
        </BottomSheet>
    );
};
