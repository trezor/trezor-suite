import { BottomSheetModal, type BottomSheetModalRef, Button, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const bottomSheetElementStyle = prepareNativeStyle(utils => ({
    marginVertical: utils.spacings.sp8,
}));

interface TronStakingVotesBottomSheetProps {
    ref: BottomSheetModalRef;
    onClose: () => void;
}

export const TronStakingVotesBottomSheet = ({ ref, onClose }: TronStakingVotesBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <BottomSheetModal
            ref={ref}
            title={
                <Text variant="headline-sm" textAlign="center">
                    <Translation id="earn.tron.votesBottomSheet.title" />
                </Text>
            }
            paddingHorizontal="sp24"
        >
            <Text
                color="contentSecondary"
                textAlign="center"
                style={applyStyle(bottomSheetElementStyle)}
            >
                <Translation id="earn.stakingBottomSheet.description" />
            </Text>

            <Button onPress={onClose} style={applyStyle(bottomSheetElementStyle)}>
                <Translation id="generic.buttons.gotIt" />
            </Button>
        </BottomSheetModal>
    );
};
