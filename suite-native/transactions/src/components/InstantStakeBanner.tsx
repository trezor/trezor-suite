import { useSelector } from 'react-redux';

import { getInstantStakeType } from '@suite-common/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Box, Text } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { type WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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

    const stakeResult = transaction.internalTransfers
        .map(internalTx => ({ internalTx, type: getInstantStakeType(internalTx, address, symbol) }))
        .find(({ type }) => type !== null);

    const internalTransfer = stakeResult?.internalTx;
    const stakeType = stakeResult?.type ?? null;

    if (!internalTransfer || !stakeType || stakeType === 'change-delegate') return null;

    const amount = formatNetworkAmount(internalTransfer.amount ?? '0', symbol, false);
    const displaySymbol = getNetworkDisplaySymbol(symbol);

    const labelMap = {
        stake: translate('earn.instantStakeBanner.stakedTitle', { amount, displaySymbol }),
        unstake: translate('earn.instantStakeBanner.unstakedTitle', { amount, displaySymbol }),
        claim: translate('earn.instantStakeBanner.claimedTitle', { amount, displaySymbol }),
    } satisfies Record<Exclude<typeof stakeType, 'change-delegate'>, string>;

    const label = labelMap[stakeType];

    return (
        <Box style={applyStyle(bannerStyle)}>
            <Text variant="body-sm" color="textDefault">
                {label}
            </Text>
        </Box>
    );
};
