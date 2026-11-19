import { memo } from 'react';

import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetNetworkSymbol,
} from '@suite-common/assets';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Column, Text } from '@trezor/components';

import { TruncatedAmount } from '#src/components/earn/yield/common/TruncatedAmount';
import { BaseCurrencyValue, FormattedCryptoAmount } from '#src/components/suite';
import { useAccountScopedSelector } from '#src/hooks/wallet/useAccountScopedSelector';

import { HOME_ASSET_BALANCE_MAX_WIDTH, HOME_ASSET_LINE_GAP } from './homeAssetTableLayout';

type HomeAssetBalanceProps = {
    assetKey: WalletAssetKey;
    isHidden?: boolean;
    /** The amount one account holds of the asset, instead of the whole wallet's. */
    accountKey?: AccountKey;
};

export const HomeAssetBalance = memo(
    ({ assetKey, isHidden, accountKey }: HomeAssetBalanceProps) => {
        const networkSymbol = useAccountScopedSelector(accountKey, state =>
            selectWalletAssetNetworkSymbol(state, assetKey, isHidden),
        );
        const contractAddress = useAccountScopedSelector(accountKey, state =>
            selectWalletAssetContractAddress(state, assetKey, isHidden),
        );
        const amount = useAccountScopedSelector(accountKey, state =>
            selectWalletAssetAmount(state, assetKey, isHidden),
        );

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
    },
);
