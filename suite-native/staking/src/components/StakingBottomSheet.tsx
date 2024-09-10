import { BottomSheet, Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const bottomSheetElementStyle = prepareNativeStyle(utils => ({
    marginVertical: utils.spacings.small,
}));

type StakingBottomSheetProps = {
    isCardSelected: boolean;
    handleToggleBottomSheet: (value: boolean) => void;
    handleDesktopClick: () => void;
};

export const StakingBottomSheet = ({
    isCardSelected,
    handleToggleBottomSheet,
    handleDesktopClick,
}: StakingBottomSheetProps) => {
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
            onClose={() => handleToggleBottomSheet(false)}
            paddingHorizontal="large"
        >
            <Text
                color="textSubdued"
                textAlign="center"
                style={applyStyle(bottomSheetElementStyle)}
            >
                <Translation id="staking.stakingBottomSheet.description" />
            </Text>

            <Button
                onPress={() => handleToggleBottomSheet(false)}
                style={applyStyle(bottomSheetElementStyle)}
            >
                <Translation id="generic.buttons.gotIt" />
            </Button>

            <Button
                colorScheme="tertiaryElevation0"
                onPress={handleDesktopClick}
                viewLeft="externalLink"
                style={applyStyle(bottomSheetElementStyle)}
            >
                <Translation id="staking.trezorDesktop" />
            </Button>
        </BottomSheet>
    );
};
