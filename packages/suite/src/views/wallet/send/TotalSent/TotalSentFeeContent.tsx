import { useTranslation } from '@suite/intl';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { selectFiatFromCryptoValue, useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import {
    type TronFeeBreakdown,
    convertAmountSubunitsToUnits,
    formatNetworkAmount,
} from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { type TokenInfo } from '@trezor/connect';

import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useSelector } from '#src/hooks/suite/useSelector';

type TotalSentFeeContentProps = {
    transactionInfo: GeneralPrecomposedTransaction;
    networkType: NetworkType;
    networkSymbol: NetworkSymbol;
    tokenInfo: TokenInfo | undefined;
    tronFees: TronFeeBreakdown | null;
};

export function TotalSentFeeContent({
    transactionInfo,
    networkType,
    networkSymbol,
    tokenInfo,
    tronFees,
}: TotalSentFeeContentProps) {
    const { translationString } = useTranslation();
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(networkSymbol);

    const hasTransactionInfo = transactionInfo.type !== 'error';
    const feeAmount = formatNetworkAmount(
        hasTransactionInfo ? transactionInfo.fee : '0',
        networkSymbol,
    );
    const tokenAmount =
        hasTransactionInfo && tokenInfo
            ? convertAmountSubunitsToUnits(transactionInfo.totalSpent, tokenInfo.decimals)
            : '0';
    const tokenFiatAmount = useSelector(state =>
        selectFiatFromCryptoValue(
            state,
            tokenAmount,
            networkSymbol,
            tokenInfo?.contract as TokenAddress,
        ),
    );
    const feeFiatAmount = useSelector(state =>
        selectFiatFromCryptoValue(state, feeAmount, networkSymbol),
    );

    if (transactionInfo.type === 'error') return null;

    if (networkType === 'tron') {
        return (
            <Column alignItems="flex-end" gap={4}>
                {tronFees?.trxBurned && !tronFees.trxBurned.isZero() && (
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={tronFees.trxBurned.toString()}
                        networkSymbol={networkSymbol}
                    />
                )}
                {tronFees?.coveredEnergy.gt(0) && (
                    <Text>
                        {translationString('TR_TRON_FEE_ENERGY', {
                            count: tronFees.coveredEnergy.toNumber(),
                        })}
                    </Text>
                )}
                {tronFees?.coveredBandwidth.gt(0) && (
                    <Text>
                        {translationString('TR_TRON_FEE_BANDWIDTH', {
                            count: tronFees.coveredBandwidth.toNumber(),
                        })}
                    </Text>
                )}
            </Column>
        );
    }

    if (tokenInfo) {
        const totalFiatIncludingFee =
            shallDisplayBaseCurrency && tokenFiatAmount && feeFiatAmount
                ? tokenFiatAmount.plus(feeFiatAmount)
                : null;

        return (
            <Column alignItems="flex-end" gap={4}>
                <FormattedCryptoAmount
                    disableHiddenPlaceholder
                    value={feeAmount}
                    networkSymbol={networkSymbol}
                />
                {totalFiatIncludingFee !== null && (
                    <BaseCurrencyValue
                        disableHiddenPlaceholder
                        shouldConvert={false}
                        amount={totalFiatIncludingFee.toFixed()}
                        symbol={networkSymbol}
                    />
                )}
            </Column>
        );
    }

    if (shallDisplayBaseCurrency) {
        return (
            <BaseCurrencyValue
                disableHiddenPlaceholder
                amount={formatNetworkAmount(transactionInfo.totalSpent, networkSymbol)}
                symbol={networkSymbol}
            />
        );
    }

    return null;
}
