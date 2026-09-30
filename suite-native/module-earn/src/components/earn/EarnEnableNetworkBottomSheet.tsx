import { useSelector } from 'react-redux';

import {
    type NetworkSymbol,
    type NetworksRootState,
    selectNetworkColor,
} from '@suite-common/networks';
import { getNetwork } from '@suite-common/wallet-config';
import {
    BottomSheetModal,
    type BottomSheetModalRef,
    Box,
    Button,
    TitleHeader,
} from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type EarnType } from '../../types';
import { StakingPromoRingIcon } from '../staking/StakingPromoRingIcon';

const buttonContainerStyle = prepareNativeStyle(utils => ({
    width: '100%',
    marginTop: utils.spacings.sp24,
}));

const titleTranslationIds = {
    staking: 'earn.earnScreen.enableNetworkModal.title',
    yield: 'earn.earnScreen.enableNetworkModal.defiYield.title',
} satisfies Record<EarnType, TxKeyPath>;

const subtitleTranslationIds = {
    staking: 'earn.earnScreen.enableNetworkModal.subtitle',
    yield: 'earn.earnScreen.enableNetworkModal.defiYield.subtitle',
} satisfies Record<EarnType, TxKeyPath>;

const ctaTranslationIds = {
    staking: 'earn.earnScreen.enableNetworkModal.cta',
    yield: 'earn.earnScreen.enableNetworkModal.defiYield.cta',
} satisfies Record<EarnType, TxKeyPath>;

type EarnEnableNetworkBottomSheetProps = {
    ref: BottomSheetModalRef;
    type: EarnType;
    symbol: NetworkSymbol | null;
    onEnablePress: () => void;
    onDismiss?: () => void;
};

export const EarnEnableNetworkBottomSheet = ({
    ref,
    symbol,
    type,
    onEnablePress,
    onDismiss,
}: EarnEnableNetworkBottomSheetProps) => {
    const { applyStyle } = useNativeStyles();

    const networkColor = useSelector((state: NetworksRootState) =>
        selectNetworkColor(state, symbol),
    );

    const networkName = symbol ? getNetwork(symbol).name : '';

    return (
        <BottomSheetModal ref={ref} onDismiss={onDismiss}>
            {symbol && (
                <Box alignItems="center" paddingHorizontal="sp16">
                    <StakingPromoRingIcon networkColor={networkColor}>
                        <TokenIcon tokenSymbol={symbol} networkSymbol={symbol} size="large" />
                    </StakingPromoRingIcon>

                    <TitleHeader
                        title={
                            <Translation id={titleTranslationIds[type]} values={{ networkName }} />
                        }
                        subtitle={
                            <Translation
                                id={subtitleTranslationIds[type]}
                                values={{ networkName }}
                            />
                        }
                        titleVariant="headline-sm"
                        textAlign="center"
                    />
                    <Box style={applyStyle(buttonContainerStyle)}>
                        <Button onPress={onEnablePress}>
                            <Translation id={ctaTranslationIds[type]} values={{ networkName }} />
                        </Button>
                    </Box>
                </Box>
            )}
        </BottomSheetModal>
    );
};
