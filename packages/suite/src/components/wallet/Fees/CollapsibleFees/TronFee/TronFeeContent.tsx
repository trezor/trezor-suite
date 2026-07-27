import { Translation, useTranslation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { type TronFeeBreakdown } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';

type TronFeeContentProps = {
    tx: GeneralPrecomposedTransaction | undefined;
    fees: TronFeeBreakdown | null;
    networkSymbol: NetworkSymbol;
    typographyStyle: TypographyStyle;
};

export function TronFeeContent({ tx, fees, networkSymbol, typographyStyle }: TronFeeContentProps) {
    const { translationString } = useTranslation();

    const hasTx = tx !== undefined && tx.type !== 'error' && 'bytes' in tx;

    if (!hasTx) {
        return (
            <Text
                intent="neutral"
                priority="secondary"
                typographyStyle={typographyStyle}
                data-testid="@wallet/tron-fee-to-be-calculated"
            >
                <Translation id="TO_BE_CALCULATED" />
            </Text>
        );
    }

    const resourceParts: string[] = [];
    if (fees?.coveredEnergy.gt(0)) {
        resourceParts.push(
            translationString('TR_TRON_FEE_ENERGY', { count: fees.coveredEnergy.toNumber() }),
        );
    }
    if (fees?.coveredBandwidth.gt(0)) {
        resourceParts.push(
            translationString('TR_TRON_FEE_BANDWIDTH', { count: fees.coveredBandwidth.toNumber() }),
        );
    }
    const resourcesLabel = resourceParts.join(' & ');

    if (fees?.trxBurned && !fees.trxBurned.isZero()) {
        return (
            <Column alignItems="flex-end" gap={2}>
                <Text intent="neutral" typographyStyle={typographyStyle}>
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={fees.trxBurned.toString()}
                        symbol={networkSymbol}
                    />{' '}
                    <BaseCurrencyValue
                        disableHiddenPlaceholder
                        amount={fees.trxBurned.toString()}
                        symbol={networkSymbol}
                        showApproximationIndicator
                    />
                </Text>
                {resourcesLabel && (
                    <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                        + {resourcesLabel}
                    </Text>
                )}
            </Column>
        );
    }

    if (resourcesLabel) {
        return (
            <Text intent="neutral" typographyStyle={typographyStyle}>
                {resourcesLabel}
            </Text>
        );
    }

    return null;
}
