import { memo } from 'react';

import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Column, Text } from '@trezor/components';

import { TruncatedAmount } from '#src/components/earn/yield/common/TruncatedAmount';
import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useSelector } from '#src/hooks/suite/useSelector';

import { HOME_ASSET_BALANCE_MAX_WIDTH, HOME_ASSET_LINE_GAP } from './homeAssetTableLayout';

type HomeAssetBalanceProps = {
    assetKey: WalletAssetKey;
    isHidden?: boolean;
};

export const HomeAssetBalance = memo(({ assetKey, isHidden }: HomeAssetBalanceProps) => {
    const networkSymbol = useSelector(state =>
        selectWalletAssetNetworkSymbol(state, assetKey, isHidden),
    );
    const contractAddress = useSelector(state =>
        selectWalletAssetContractAddress(state, assetKey, isHidden),
    );
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey, isHidden));

    if (networkSymbol === undefined || amount === undefined) {
        return null;
    }

    return (
        <Column alignItems="flex-end" gap={HOME_ASSET_LINE_GAP}>
            <BaseCurrencyValue
                amount={amount}
                symbol={networkSymbol}
                tokenAddress={contractAddress}
            />
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
                        networkSymbol={networkSymbol}
                        contractAddress={contractAddress}
                        isCompact
                    />
                </TruncatedAmount>
            </Text>
        </Column>
    );
});
