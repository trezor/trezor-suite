import { memo, useEffect, useState } from 'react';

import { getNetwork } from '@suite-common/wallet-config';
import { AmountUnit, asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { TypographyStyle } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';

import { useFeesContext } from '../context/FeesContext';

export type MaximumFeeProps = {
    typographyStyle: TypographyStyle;
};

export const MaximumFee = memo(function MaximumFeeInner({ typographyStyle }: MaximumFeeProps) {
    const { networkSymbol, composedLevels, selectedFeeLevel } = useFeesContext();
    const transactionInfo = composedLevels?.[selectedFeeLevel.label];
    const txFee = transactionInfo?.type !== 'error' ? transactionInfo?.fee : null;
    const [txMaximumFee, setTxMaximumFee] = useState<AmountUnit | null>(null);

    useEffect(() => {
        if (txFee) {
            const txMaxFee = subunitsToUnits({
                value: asAmountSubunit(new BigNumber(txFee ?? '0')),
                symbol: networkSymbol,
                decimals: getNetwork(networkSymbol)?.decimals,
            });
            setTxMaximumFee(txMaxFee);
        }
    }, [networkSymbol, txFee]);

    if (!txMaximumFee) {
        return (
            <Text variant="tertiary" typographyStyle={typographyStyle}>
                <Translation id="TO_BE_CALCULATED" />
            </Text>
        );
    }

    return (
        <Column alignItems="flex-end">
            <Text variant="default" typographyStyle={typographyStyle}>
                <FormattedCryptoAmount
                    data-testid="@trading/quote/maximum-fee-amount"
                    disableHiddenPlaceholder
                    value={txMaximumFee}
                    symbol={networkSymbol}
                />
            </Text>

            <Text
                data-testid="@trading/quote/maximum-fee-fiat-amount"
                variant="tertiary"
                typographyStyle="hint"
            >
                <BaseCurrencyValue
                    disableHiddenPlaceholder
                    amount={txMaximumFee}
                    symbol={networkSymbol}
                    showApproximationIndicator
                />
            </Text>
        </Column>
    );
});
