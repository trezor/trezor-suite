import { fromWei } from 'web3-utils';

import { formatDurationStrict } from '@suite-common/suite-utils';
import { FeeRate } from '@trezor/product-components';

import { FiatValue } from 'src/components/suite';
import { useLocales } from 'src/hooks/suite';

import { FeeOptionType } from '../Fees';
import { FeeCard } from './FeeCard';
import { StandardFeeProps } from './StandardFee';

export const EthereumFeeCards = ({
    showFee,
    feeOptions,
    selectedLevel,
    changeFeeLevel,
    symbol,
    networkType,
}: StandardFeeProps) => {
    const locale = useLocales();
    if (!showFee || !feeOptions.length) {
        return null;
    }

    const isEip1559 = feeOptions[0].effectiveGasPrice !== undefined;

    const getTimeEstimate = (fee: FeeOptionType) => {
        if (isEip1559) {
            return `~${formatDurationStrict(fee.maxWaitTime || 0, locale)}`;
        }

        return '';
    };

    return (
        <>
            {feeOptions?.map((fee, index) => (
                <FeeCard
                    key={index}
                    value={fee.value}
                    isSelected={selectedLevel.label === fee.value}
                    changeFeeLevel={changeFeeLevel}
                    topLeftChild={<span data-testid={`@fee-card/${fee.value}`}>{fee.label}</span>}
                    topRightChild={getTimeEstimate(fee)}
                    bottomLeftChild={
                        <FiatValue
                            disableHiddenPlaceholder
                            amount={fee.networkAmount || ''}
                            symbol={symbol}
                            showApproximationIndicator
                        />
                    }
                    bottomRightChild={
                        <FeeRate
                            feeRate={
                                isEip1559
                                    ? fromWei(fee.effectiveGasPrice || '0', 'gwei')
                                    : fee?.feePerUnit
                            }
                            networkType={networkType}
                            symbol={symbol}
                        />
                    }
                />
            ))}
        </>
    );
};
