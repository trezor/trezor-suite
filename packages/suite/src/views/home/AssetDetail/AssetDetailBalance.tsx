import { HiddenPlaceholder } from '@suite/discreet-mode';
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
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { Card, Column, Row, Skeleton, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

const HEADER_GAP = 24;
const AMOUNT_GAP = 4;

type AssetDetailBalanceProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailBalanceSkeleton = () => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);

    return (
        <Card height="100%" data-testid="@asset-detail/balance-skeleton">
            <Column
                gap={HEADER_GAP}
                height="100%"
                justifyContent="space-between"
                alignItems="stretch"
            >
                <Row justifyContent="space-between" alignItems="center">
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET_DETAIL_MY_BALANCE" />
                    </Text>
                    <Skeleton width={80} height={16} animate={shouldAnimate} />
                </Row>
                <Column gap={AMOUNT_GAP} alignItems="flex-start">
                    <Skeleton width={180} height={32} animate={shouldAnimate} />
                    <Skeleton width={120} height={20} animate={shouldAnimate} />
                </Column>
            </Column>
        </Card>
    );
};

export const AssetDetailBalance = ({ assetKey }: AssetDetailBalanceProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
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
        <Card height="100%" data-testid="@asset-detail/balance">
            <Column
                gap={HEADER_GAP}
                height="100%"
                justifyContent="space-between"
                alignItems="stretch"
            >
                <Row justifyContent="space-between" alignItems="center">
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_ASSET_DETAIL_MY_BALANCE" />
                    </Text>
                    {accountCount > 0 && (
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_ACCOUNT_COUNT" values={{ count: accountCount }} />
                        </Text>
                    )}
                </Row>
                <Column gap={AMOUNT_GAP} alignItems="flex-start">
                    {fiatValue !== undefined && (
                        <HiddenPlaceholder>
                            <Text
                                typographyStyle="headline-md"
                                data-testid="@asset-detail/balance/fiat-amount"
                            >
                                <BaseCurrencyAmountFormatter value={fiatValue} />
                            </Text>
                        </HiddenPlaceholder>
                    )}
                    <Text typographyStyle="body-md">
                        <FormattedCryptoAmount
                            value={amount}
                            symbol={tokenSymbol ?? symbol}
                            contractAddress={contractAddress}
                            tokenDecimals={tokenDecimals}
                            isSymbolSecondary
                        />
                    </Text>
                </Column>
            </Column>
        </Card>
    );
};
