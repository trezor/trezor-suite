import { AssetValue } from '@suite/assets';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type BaseCurrencyAmount } from '@suite-common/wallet-types';
import { asAmountUnit } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite';

export type AssetAmountProps = {
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    amount: string;
    fiatAmount?: BaseCurrencyAmount;
    showNoTradingPairText?: boolean;
    isFiatPrimary?: boolean;
    isDisabled?: boolean;
};

export function AssetAmount({
    networkSymbol,
    contractAddress,
    amount,
    fiatAmount,
    showNoTradingPairText = false,
    isFiatPrimary = false,
    isDisabled = false,
}: AssetAmountProps) {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const fiatCurrency = useSelector(selectBaseCurrency);

    const cryptoAmount = (
        <Text
            intent="neutral"
            priority={isFiatPrimary ? 'secondary' : undefined}
            typographyStyle={isFiatPrimary ? 'body-sm' : 'body-md'}
            isDisabled={isDisabled}
        >
            <AssetValue
                amount={asAmountUnit(new BigNumber(amount))}
                networkSymbol={networkSymbol}
                contractAddress={contractAddress}
                isCompact
            />
        </Text>
    );

    const fiat = (
        <>
            {fiatAmount && (
                <Text
                    intent="neutral"
                    priority={isFiatPrimary ? undefined : 'secondary'}
                    typographyStyle={isFiatPrimary ? 'body-md' : 'body-sm'}
                    isDisabled={isDisabled}
                >
                    <BaseCurrencyAmountFormatter value={fiatAmount} currency={fiatCurrency} />
                </Text>
            )}
            {!fiatAmount && showNoTradingPairText && (
                <Text
                    intent="neutral"
                    priority="secondary"
                    typographyStyle="body-sm"
                    isDisabled={isDisabled}
                >
                    <Translation id="TR_HIDDEN_TOKEN_WITHOUT_FIAT" />
                </Text>
            )}
        </>
    );

    return (
        <Column alignItems="flex-end">
            {isFiatPrimary ? fiat : cryptoAmount}
            {isFiatPrimary ? cryptoAmount : fiat}
        </Column>
    );
}
