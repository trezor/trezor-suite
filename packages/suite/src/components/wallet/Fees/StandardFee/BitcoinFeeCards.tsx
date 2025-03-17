import { formatDurationStrict } from '@suite-common/suite-utils';
import { FeeRate } from '@trezor/product-components';

import { Translation } from 'src/components/suite';
import { FiatValue } from 'src/components/suite/FiatValue';
import { useLocales } from 'src/hooks/suite';

import { FeeCard } from './FeeCard';
import { StandardFeeProps } from './StandardFee';
import { getFeeLevelTranslationId } from '../Fees';

export const BitcoinFeeCards = ({
    networkType,
    feeInfo,
    transactionInfo,
    feeOptions,
    showFee,
    selectedLevel,
    changeFeeLevel,
    symbol,
}: StandardFeeProps) => {
    const locale = useLocales();

    if (!showFee || !feeOptions.length) {
        return null;
    }

    const hasInfo = transactionInfo && transactionInfo.type !== 'error';

    return feeOptions.map((fee, index) => (
        <FeeCard
            key={index}
            value={fee.value}
            isSelected={selectedLevel.label === fee.value}
            changeFeeLevel={changeFeeLevel}
            topLeftChild={
                <span data-testid={`@fee-card/${fee.value}`}>
                    <Translation id={getFeeLevelTranslationId(fee.value)} />
                </span>
            }
            topRightChild={
                <>~{formatDurationStrict(feeInfo.blockTime * (fee?.blocks ?? 0) * 60, locale)}</>
            }
            bottomLeftChild={
                <FiatValue
                    disableHiddenPlaceholder
                    amount={fee?.networkAmount ?? ''}
                    symbol={symbol}
                    showApproximationIndicator
                />
            }
            bottomRightChild={
                <>
                    <FeeRate feeRate={fee.feePerUnit} networkType={networkType} symbol={symbol} />
                    {hasInfo ? ` (${transactionInfo.bytes} B)` : ''}
                </>
            }
        />
    ));
};
