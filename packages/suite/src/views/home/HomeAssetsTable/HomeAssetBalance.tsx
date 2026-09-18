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

import { TruncatedAmount } from 'src/components/earn/yield/common/TruncatedAmount';
import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { HOME_ASSET_BALANCE_MAX_WIDTH, HOME_ASSET_LINE_GAP } from './homeAssetTableLayout';

type HomeAssetBalanceProps = {
    assetKey: WalletAssetKey;
    isHidden?: boolean;
};

export const HomeAssetBalance = memo(({ assetKey, isHidden }: HomeAssetBalanceProps) => {
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey, isHidden));
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(state, assetKey, isHidden),
    );
    const tokenSymbol = useSelector(state =>
        selectWalletAssetTokenSymbol(state, assetKey, isHidden),
    );
    const tokenDecimals = useSelector(state =>
        selectWalletAssetTokenDecimals(state, assetKey, isHidden),
    );
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey, isHidden));

    if (symbol === undefined || amount === undefined) {
        return null;
    }

    return (
        <Column alignItems="flex-end" gap={HOME_ASSET_LINE_GAP}>
            <BaseCurrencyValue amount={amount} symbol={symbol} tokenAddress={contractAddress} />
            <Text
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                ellipsisLineCount={1}
                maxWidth={HOME_ASSET_BALANCE_MAX_WIDTH}
            >
                <TruncatedAmount>
                    <FormattedCryptoAmount
                        value={amount}
                        symbol={tokenSymbol ?? symbol}
                        contractAddress={contractAddress}
                        tokenDecimals={tokenDecimals}
                        isCompact
                    />
                </TruncatedAmount>
            </Text>
        </Column>
    );
});
