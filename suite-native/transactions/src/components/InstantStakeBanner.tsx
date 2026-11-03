import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    getInstantStakeType,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { Box, Discreet, Text } from '@suite-native/atoms';
import { ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type InstantStakeBannerProps = {
    accountKey: AccountKey;
    transaction: WalletAccountTransaction;
};

const bannerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillInfoSoft,
    borderRadius: utils.borders.radii.r12,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp10,
    alignSelf: 'stretch',
    marginTop: utils.spacings.sp12,
}));

export const InstantStakeBanner = ({ accountKey, transaction }: InstantStakeBannerProps) => {
    const { applyStyle } = useNativeStyles();

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

    const displaySymbol = getNetworkDisplaySymbol(symbol);

    const labelMap: Record<Exclude<typeof stakeType, 'change-delegate'>, TxKeyPath> = {
        stake: 'earn.instantStakeBanner.stakedTitle',
        unstake: 'earn.instantStakeBanner.unstakedTitle',
        claim: 'earn.instantStakeBanner.claimedTitle',
    };

    return (
        <Box style={applyStyle(bannerStyle)}>
            <Discreet>
                <Text variant="body-sm" color="contentPrimary">
                    <Translation
                        id={labelMap[stakeType]}
                        values={{
                            amount: (
                                <ExactCryptoAmountFormatter
                                    value={internalTransfer.amount ?? '0'}
                                    symbol={symbol}
                                    isBalance={false}
                                    withSymbol={false}
                                    variant="body-sm"
                                    color="contentPrimary"
                                />
                            ),
                            displaySymbol,
                        }}
                    />
                </Text>
            </Discreet>
        </Box>
    );
};
