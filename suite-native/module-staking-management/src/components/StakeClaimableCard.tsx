import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { Box, Card, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { selectClaimableAmountByAccountKey } from '@suite-native/staking';
import { NativeStakingRootState } from '@suite-native/staking/src/types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type StakeClaimableCardProps = {
    accountKey: string;
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

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const claimableAmount = useSelector((state: NativeStakingRootState) =>
        selectClaimableAmountByAccountKey(state, accountKey),
    );

    if (!symbol || !claimableAmount || parseFloat(claimableAmount) === 0) {
        return null;
    }

    return (
        <TouchableOpacity onPress={() => handleToggleBottomSheet(true)}>
            <Card>
                <Box style={applyStyle(stakingItemStyle)}>
                    <Box flex={1}>
                        <Text>
                            <Translation id="staking.claimableCard.claimable" />
                        </Text>
                    </Box>
                    <Box style={applyStyle(valuesContainerStyle)}>
                        <CryptoAmountFormatter
                            value={claimableAmount}
                            symbol={symbol}
                            decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                            color="textDefault"
                            variant="highlight"
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
        </TouchableOpacity>
    );
};
