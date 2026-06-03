import { FeeCard, FeeCardsWrapper, feeLevelTranslationMap } from '@suite/fee';
import { Translation } from '@suite/intl';
import { type FeeOptionType, useFeesContext } from '@suite-common/fee';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

import { BaseCurrencyValue } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

type MiscFeeCardsProps = {
    feeOptions: FeeOptionType[];
};

// Solana, Ripple, Cardano and other networks with only one option
export const MiscFeeCards = ({ feeOptions }: MiscFeeCardsProps) => {
    const { networkType, networkSymbol, changeFeeLevel } = useFeesContext();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, networkSymbol));

    const isSolanaNetwork = networkType === 'solana';
    const fee = feeOptions[0];

    if (!fee) return null;

    const shouldShowCurrentFee = !isSolanaNetwork || fee.networkAmount;
    const feeAmount = isSolanaNetwork ? fee.feePerTx : fee.feePerUnit;

    return (
        <FeeCardsWrapper data-testid="@wallet/fee-details">
            <FeeCard
                value={fee.value}
                isSelected={true}
                changeFeeLevel={changeFeeLevel}
                isLoading={areFeesLoading}
                topLeftChild={
                    <span data-testid={`@fee-card/${fee.value}`}>
                        <Translation id={feeLevelTranslationMap[fee.value]} />
                    </span>
                }
                bottomLeftChild={
                    <BaseCurrencyValue
                        disableHiddenPlaceholder
                        amount={fee.networkAmount || ''}
                        symbol={networkSymbol}
                        showApproximationIndicator
                    />
                }
                bottomRightChild={
                    shouldShowCurrentFee && (
                        <Text
                            data-testid="@wallet/misc-fee-amount"
                            intent="neutral"
                            priority="secondary"
                        >
                            {feeAmount} {getFeeUnits(networkType)}
                        </Text>
                    )
                }
            />
        </FeeCardsWrapper>
    );
};
