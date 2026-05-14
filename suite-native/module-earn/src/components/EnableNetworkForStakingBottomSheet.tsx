import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    TitleHeader,
} from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { StakingPromoRingIcon } from './StakingPromoRingIcon';

type EnableNetworkForStakingBottomSheetProps = {
    ref: BottomSheetModalRef;
    symbol: NetworkSymbol | null;
    onEnablePress: () => void;
    onDismiss?: () => void;
};

const buttonContainerStyle = prepareNativeStyle(utils => ({
    width: '100%',
    marginTop: utils.spacings.sp24,
}));

export const EnableNetworkForStakingBottomSheet = ({
    ref,
    symbol,
    onEnablePress,
    onDismiss,
}: EnableNetworkForStakingBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    const networkName = symbol ? getNetwork(symbol).name : '';

    return (
        <BottomSheetModal ref={ref} onDismiss={onDismiss}>
            {symbol ? (
                <Box alignItems="center" paddingHorizontal="sp16">
                    <StakingPromoRingIcon symbol={symbol}>
                        <CryptoIcon symbol={symbol} size="large" />
                    </StakingPromoRingIcon>
                    <TitleHeader
                        titleVariant="headline-sm"
                        title={
                            <Translation
                                id="earn.earnScreen.enableNetworkModal.title"
                                values={{ networkName }}
                            />
                        }
                        subtitle={
                            <Translation
                                id="earn.earnScreen.enableNetworkModal.subtitle"
                                values={{ networkName }}
                            />
                        }
                        textAlign="center"
                    />
                    <Box style={applyStyle(buttonContainerStyle)}>
                        <Button onPress={onEnablePress}>
                            <Translation
                                id="earn.earnScreen.enableNetworkModal.cta"
                                values={{ networkName }}
                            />
                        </Button>
                    </Box>
                </Box>
            ) : null}
        </BottomSheetModal>
    );
};
