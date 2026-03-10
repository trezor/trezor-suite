import { useSelector } from 'react-redux';

import { getInstantStakeType } from '@suite-common/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Box, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { type WalletAccountTransaction } from '@suite-native/tokens';
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

export const InstantStakeBanner = ({ accountKey, transaction }: InstantStakeBannerProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

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

    const amount = formatNetworkAmount(internalTransfer.amount ?? '0', symbol, false);
    const displaySymbol = getNetworkDisplaySymbol(symbol);

    let label: string;
    switch (stakeType) {
        case 'stake':
            label = translate('earn.instantStakeBanner.stakedTitle', { amount, displaySymbol });
            break;
        case 'unstake':
            label = translate('earn.instantStakeBanner.unstakedTitle', { amount, displaySymbol });
            break;
        case 'claim':
            label = translate('earn.instantStakeBanner.claimedTitle', { amount, displaySymbol });
            break;
        case 'change-delegate':
            return null;
    }

    return (
        <Box style={applyStyle(bannerStyle)}>
            <Text variant="body-sm" color="textDefault">
                {label}
            </Text>
        </Box>
    );
};
