import { getFeeUnits } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

import { FiatValue } from 'src/components/suite';

import { FeeCard } from './FeeCard';
import { StandardFeeProps } from './StandardFee';

// Solana, Ripple, Cardano and other networks with only one option
export const MiscFeeCards = ({
    networkType,
    showFee,
    feeOptions,
    symbol,
    changeFeeLevel,
}: StandardFeeProps) => {
    if (!showFee || !feeOptions.length) {
        return null;
    }

    const feeOption = feeOptions[0]; // in the future Solana should have it's own Details component
    const feeAmount = networkType === 'solana' ? feeOption.feePerTx : feeOption.feePerUnit;

    return (
        <FeeCard
            value={feeOption.value}
            isSelected={true}
            changeFeeLevel={changeFeeLevel}
            topLeftChild={
                <span data-testid={`@fee-card/${feeOption.value}`}>{feeOption.label}</span>
            }
            topRightChild=""
            bottomLeftChild={
                <FiatValue
                    disableHiddenPlaceholder
                    amount={feeOption.networkAmount || ''}
                    symbol={symbol}
                    showApproximationIndicator
                />
            }
            bottomRightChild={
                <Text variant="tertiary">
                    {feeAmount} {getFeeUnits(networkType)}
                </Text>
            }
        />
    );
};
