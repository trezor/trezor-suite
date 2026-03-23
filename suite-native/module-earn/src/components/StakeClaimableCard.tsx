import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { selectAccountNetworkSymbol, useAccoutsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, PressableOpacity, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    selectClaimableAmountByAccountKey,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type StakeClaimableCardProps = {
    accountKey: AccountKey;
    handleToggleBottomSheet: (value: boolean) => void;
};

const stakingItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp4,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '45%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.sp8,
}));

export const StakeClaimableCard = ({
    accountKey,
    handleToggleBottomSheet,
}: StakeClaimableCardProps) => {
    const { applyStyle } = useNativeStyles();

    const symbol = useAccoutsSelector(state => selectAccountNetworkSymbol(state, accountKey));

    const claimableAmount = useNativeStakingSelector(state =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );

    if (!symbol || !claimableAmount || parseFloat(claimableAmount) === 0) {
        return null;
    }

    return (
        <PressableOpacity onPress={() => handleToggleBottomSheet(true)}>
            <Card>
                <Box style={applyStyle(stakingItemStyle)}>
                    <Box flex={1}>
                        <Text>
                            <Translation id="earn.claimableCard.claimable" />
                        </Text>
                    </Box>
                    <Box style={applyStyle(valuesContainerStyle)}>
                        <CryptoAmountFormatter
                            value={claimableAmount}
                            symbol={symbol}
                            decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                            color="textDefault"
                            variant="body-md-strong"
                        />
                        <Box flexDirection="row">
                            <Text color="textSubdued">≈</Text>
                            <CryptoToFiatAmountFormatter
                                value={claimableAmount}
                                symbol={symbol}
                                color="textSubdued"
                                isBalance
                            />
                        </Box>
                    </Box>
                </Box>
            </Card>
        </PressableOpacity>
    );
};
