import { Translation } from '@suite/intl';
import {
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetFiatValue,
    selectWalletAssetHoldingAccountCount,
    selectWalletAssetSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey, selectBaseCurrency } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Card, Column, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount, HiddenPlaceholder } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

type AssetDetailBalanceProps = {
    assetKey: WalletAssetKey;
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
    const accountCount = useSelector(state =>
        selectWalletAssetHoldingAccountCount(state, assetKey),
    );

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
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_ASSET_DETAIL_ACCOUNT_COUNT"
                            values={{ count: accountCount }}
                        />
                    </Text>
                </Row>
                {/* An asset nothing can price, such as an unrecognized token, shows its balance only. */}
                {fiatValue !== undefined && (
                    <Row justifyContent="space-between" alignItems="center">
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {baseCurrency.toUpperCase()}
                        </Text>
                        <Text typographyStyle="headline-md">
                            <HiddenPlaceholder>
                                {BaseCurrencyAmountFormatter.format(
                                    asBaseCurrencyAmount(new BigNumber(fiatValue)),
                                )}
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
