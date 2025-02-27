import { FeeRate } from '@trezor/product-components';

import { FiatValue } from 'src/components/suite';

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
    if (!showFee || !feeOptions.length) {
        return null;
    }

    return feeOptions.map((fee, index) => (
        <FeeCard
            key={index}
            value={fee.value}
            isSelected={selectedLevel.label === fee.value}
            changeFeeLevel={changeFeeLevel}
            topLeftChild={<span data-testid={`@fee-card/${fee.value}`}>{fee.label}</span>}
            topRightChild=""
            bottomLeftChild={
                <FiatValue
                    disableHiddenPlaceholder
                    amount={fee.networkAmount || ''}
                    symbol={symbol}
                    showApproximationIndicator
                />
            }
            bottomRightChild={
                <FeeRate feeRate={fee?.feePerUnit} networkType={networkType} symbol={symbol} />
            }
        />
    ));
};
