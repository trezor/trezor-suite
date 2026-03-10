import { useSelector } from 'react-redux';

import { getInstantStakeType } from '@suite-common/staking';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, StakeType } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Box, Text } from '@suite-native/atoms';
import { WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type InstantStakeBannerProps = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
};

const bannerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation1,
    borderRadius: utils.borders.radii.r12,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp10,
    alignSelf: 'stretch',
}));

const getStakeLabel = (stakeType: StakeType, amount: string, symbol: string): string => {
    const formattedAmount = `${amount} ${symbol.toUpperCase()}`;
    if (stakeType === 'stake') return `${formattedAmount} staked instantly`;
    if (stakeType === 'unstake') return `${formattedAmount} unstaked instantly`;

    return `${formattedAmount} claimed`;
};

export const InstantStakeBanner = ({ accountKey, transaction }: InstantStakeBannerProps) => {
    const { applyStyle } = useNativeStyles();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const address = account?.descriptor;
    const symbol = account?.symbol;

    if (!address || !symbol) return null;

    const internalTransfer = transaction.internalTransfers.find(
        internalTx => getInstantStakeType(internalTx, address, symbol) !== null,
    );

    if (!internalTransfer) return null;

    const stakeType = getInstantStakeType(internalTransfer, address, symbol);

    if (!stakeType) return null;

    const amount = formatNetworkAmount(internalTransfer.amount ?? '0', symbol);
    const label = getStakeLabel(stakeType, amount, symbol);

    return (
        <Box style={applyStyle(bannerStyle)}>
            <Text variant="body-sm" color="textDefault">
                {label}
            </Text>
        </Box>
    );
};
