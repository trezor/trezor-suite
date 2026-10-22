import { Translation } from '@suite/intl';
import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import {
    selectWalletAssetAccountCount,
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetFiatValue,
    selectWalletAssetSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey, selectBaseCurrency } from '@suite-common/wallet-core';
import { Card, Column, Row, Skeleton, Text } from '@trezor/components';

import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

type AssetDetailBalanceProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailBalanceSkeleton = () => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    return (
        <Card data-testid="@asset-detail/balance-skeleton">
            <Column gap={16} alignItems="stretch">
                <Row justifyContent="space-between" alignItems="center">
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET_DETAIL_YOUR_BALANCE" />
                    </Text>
                    <Skeleton width={80} height={16} animate={shouldAnimate} />
                </Row>
                <Row justifyContent="flex-end">
                    <Skeleton width={180} height={32} animate={shouldAnimate} />
                </Row>
                <Row justifyContent="flex-end">
                    <Skeleton width={120} height={20} animate={shouldAnimate} />
                </Row>
            </Column>
        </Card>
    );
};

export const AssetDetailBalance = ({ assetKey }: AssetDetailBalanceProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const baseCurrency = useSelector(selectBaseCurrency);
    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const contractAddress = useSelector(state => selectWalletAssetContractAddress(state, assetKey));
    const tokenSymbol = useSelector(state => selectWalletAssetTokenSymbol(state, assetKey));
    const tokenDecimals = useSelector(state => selectWalletAssetTokenDecimals(state, assetKey));
    const amount = useSelector(state => selectWalletAssetAmount(state, assetKey));
    const fiatValue = useSelector(state => selectWalletAssetFiatValue(state, assetKey));
    const accountCount = useSelector(state => selectWalletAssetAccountCount(state, assetKey));

    if (symbol === undefined || amount === undefined) {
        return null;
    }

    return (
        <Card data-testid="@asset-detail/balance">
            <Column gap={16} alignItems="stretch">
                <Row justifyContent="space-between" alignItems="center">
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET_DETAIL_YOUR_BALANCE" />
                    </Text>
                    {accountCount > 0 && (
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation
                                id="TR_ASSET_DETAIL_ACCOUNT_COUNT"
                                values={{ count: accountCount }}
                            />
                        </Text>
                    )}
                </Row>
                {fiatValue !== undefined && (
                    <Row justifyContent="space-between" alignItems="center">
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {baseCurrency.toUpperCase()}
                        </Text>
                        <Text typographyStyle="headline-md">
                            <HiddenPlaceholder>
                                {BaseCurrencyAmountFormatter.format(fiatValue)}
                            </HiddenPlaceholder>
                        </Text>
                    </Row>
                )}
                <Row justifyContent="space-between" alignItems="center">
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET" />
                    </Text>
                    <Text typographyStyle="body-md">
                        <FormattedCryptoAmount
                            value={amount}
                            symbol={tokenSymbol ?? symbol}
                            contractAddress={contractAddress}
                            tokenDecimals={tokenDecimals}
                        />
                    </Text>
                </Row>
            </Column>
        </Card>
    );
};
