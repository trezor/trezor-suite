import { memo } from 'react';

import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Column, Text } from '@trezor/components';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

type HomeAssetBalanceProps = {
    assetKey: WalletAssetKey;
};

export const HomeAssetBalance = memo(({ assetKey }: HomeAssetBalanceProps) => {
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey));
    const tokenDecimals = useSelector(state => selectWalletAssetTokenDecimals(state, assetKey));
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey));

    if (symbol === undefined || amount === undefined) {
        return null;
    }

    return (
        <Column alignItems="flex-end" gap={2}>
            <BaseCurrencyValue amount={amount} symbol={symbol} tokenAddress={contractAddress} />
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <FormattedCryptoAmount
                    value={amount}
                    symbol={tokenSymbol ?? symbol}
                    contractAddress={contractAddress}
                    tokenDecimals={tokenDecimals}
                    isCompact
                />
            </Text>
        </Column>
    );
});
