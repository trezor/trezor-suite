import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    TitleHeader,
} from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type EarnType } from './EarnItemInfoModal';
import { StakingPromoRingIcon } from './StakingPromoRingIcon';

type EnableNetworkForEarnBottomSheetProps = {
    ref: BottomSheetModalRef;
    symbol: NetworkSymbol | null;
    type?: EarnType;
    onEnablePress: () => void;
    onDismiss?: () => void;
};

const buttonContainerStyle = prepareNativeStyle(utils => ({
    width: '100%',
    marginTop: utils.spacings.sp24,
}));

const translationIdByEarnType = {
    staking: {
        title: 'earn.earnScreen.enableNetworkModal.title',
        subtitle: 'earn.earnScreen.enableNetworkModal.subtitle',
        cta: 'earn.earnScreen.enableNetworkModal.cta',
    },
    'stablecoin-yield': {
        title: 'earn.earnScreen.enableNetworkModal.defiYield.title',
        subtitle: 'earn.earnScreen.enableNetworkModal.defiYield.subtitle',
        cta: 'earn.earnScreen.enableNetworkModal.defiYield.cta',
    },
} as const;

export const EnableNetworkForEarnBottomSheet = ({
    ref,
    symbol,
    type = 'staking',
    onEnablePress,
    onDismiss,
}: EnableNetworkForEarnBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    const networkName = symbol ? getNetwork(symbol).name : '';
    const translationIds = translationIdByEarnType[type];

    return (
        <BottomSheetModal ref={ref} onDismiss={onDismiss}>
            {symbol ? (
                <Box alignItems="center" paddingHorizontal="sp16">
                    <StakingPromoRingIcon symbol={symbol}>
                        <TokenIcon symbol={symbol} size="large" />
                    </StakingPromoRingIcon>
                    <TitleHeader
                        titleVariant="headline-sm"
                        title={<Translation id={translationIds.title} values={{ networkName }} />}
                        subtitle={
                            <Translation id={translationIds.subtitle} values={{ networkName }} />
                        }
                        textAlign="center"
                    />
                    <Box style={applyStyle(buttonContainerStyle)}>
                        <Button onPress={onEnablePress}>
                            <Translation id={translationIds.cta} values={{ networkName }} />
                        </Button>
                    </Box>
                </Box>
            ) : null}
        </BottomSheetModal>
    );
};
