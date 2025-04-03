import { getFeeUnits } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

import { FiatValue, Translation } from 'src/components/suite';

import { FeeCard } from './FeeCard';
import { FeeCardsWrapper, StandardFeeProps } from './StandardFee';
import { getFeeLevelTranslationId } from '../Fees';

// Solana, Ripple, Cardano and other networks with only one option
export const MiscFeeCards = ({
    networkType,
    feeOptions,
    symbol,
    changeFeeLevel,
}: StandardFeeProps) => {
    if (!feeOptions.length) return null;

    const isSolanaNetwork = networkType === 'solana';

    const fee = feeOptions[0];
    const shouldShowCurrentFee = !isSolanaNetwork || fee.networkAmount;
    const feeAmount = isSolanaNetwork ? fee.feePerTx : fee.feePerUnit;

    return (
        <FeeCardsWrapper data-testid="@wallet/fee-details">
            <FeeCard
                value={fee.value}
                isSelected={true}
                changeFeeLevel={changeFeeLevel}
                topLeftChild={
                    <span data-testid={`@fee-card/${fee.value}`}>
                        <Translation id={getFeeLevelTranslationId(fee.value)} />
                    </span>
                }
                bottomLeftChild={
                    <FiatValue
                        disableHiddenPlaceholder
                        amount={fee.networkAmount || ''}
                        symbol={symbol}
                        showApproximationIndicator
                    />
                }
                bottomRightChild={
                    shouldShowCurrentFee && (
                        <Text variant="tertiary">
                            {feeAmount} {getFeeUnits(networkType)}
                        </Text>
                    )
                }
            />
        </FeeCardsWrapper>
    );
};
