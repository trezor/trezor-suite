import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { HELP_CENTER_ADA_STAKING } from '@trezor/urls';

type CardanoAutoStakedModalProps = {
    ref: BottomSheetModalRef;
    networkSymbol: NetworkSymbol;
};

const backgroundStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.surfaceFillRaised,
}));

export const CardanoAutoStakedModal = ({ ref, networkSymbol }: CardanoAutoStakedModalProps) => {
    const { applyStyle } = useNativeStyles();
    const openLink = useOpenLink();

    const handleLearnMorePress = () => {
        openLink(HELP_CENTER_ADA_STAKING);
    };

    return (
        <BottomSheetModal
            ref={ref}
            bottomSheetCustomProps={{ backgroundStyle: applyStyle(backgroundStyle) }}
        >
            <VStack spacing="sp24" marginVertical="sp8">
                <Text variant="headline-sm">
                    <Translation id="earn.stakingManagementScreen.cardanoAutoStakedModal.title" />
                </Text>
                <VStack spacing="sp16">
                    <Text color="contentSecondary">
                        <Translation
                            id="earn.stakingManagementScreen.cardanoAutoStakedModal.delegationDescription"
                            values={{ symbol: getNetworkDisplaySymbol(networkSymbol) }}
                        />
                    </Text>
                    <Text color="contentSecondary">
                        <Translation id="earn.stakingManagementScreen.cardanoAutoStakedModal.accessibilityDescription" />
                    </Text>
                </VStack>
                <Button
                    onPress={handleLearnMorePress}
                    priority="secondary"
                    iconLeft="arrowSquareOut"
                    testID="@staking/cardano-auto-staked-modal/learn-more-button"
                >
                    <Translation id="earn.stakingManagementScreen.cardanoAutoStakedModal.learnMoreButton" />
                </Button>
            </VStack>
        </BottomSheetModal>
    );
};
