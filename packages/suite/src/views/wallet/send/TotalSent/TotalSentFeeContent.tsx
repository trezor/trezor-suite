import { useTranslation } from '@suite/intl';
import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { type TronFeeBreakdown, formatNetworkAmount } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { type TokenInfo } from '@trezor/connect';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';

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

    if (transactionInfo.type === 'error') return null;

    if (networkType === 'tron') {
        return (
            <Column alignItems="flex-end" gap={4}>
                {tronFees?.trxBurned && !tronFees.trxBurned.isZero() && (
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={tronFees.trxBurned.toString()}
                        symbol={networkSymbol}
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
        return (
            <FormattedCryptoAmount
                disableHiddenPlaceholder
                value={formatNetworkAmount(transactionInfo.fee, networkSymbol)}
                symbol={networkSymbol}
            />
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
