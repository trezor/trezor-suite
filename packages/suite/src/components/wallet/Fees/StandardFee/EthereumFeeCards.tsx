import { forwardRef } from 'react';

import { formatDurationStrict } from '@suite-common/suite-utils';
import { isEip1559 } from '@suite-common/wallet-utils';
import { FeeRate } from '@trezor/product-components';

import { FiatValue, Translation } from 'src/components/suite';
import { useLocales } from 'src/hooks/suite';

import { FeeOptionType, getFeeLevelTranslationId } from '../Fees';
import { FeeCard } from './FeeCard';
import { FeeCardsWrapper, StandardFeeProps } from './StandardFee';

export const EthereumFeeCards = forwardRef<HTMLDivElement, StandardFeeProps>(
    ({ feeOptions, selectedLevel, changeFeeLevel, symbol, networkType, columns }, ref) => {
        const locale = useLocales();

        if (!feeOptions.length) {
            return null;
        }

        const getTimeEstimate = (fee: FeeOptionType) => {
            if (fee.maxWaitTimeEstimate) {
                return `~${formatDurationStrict(fee.maxWaitTimeEstimate / 1000, locale)}`;
            }

            return undefined;
        };

        return (
            <FeeCardsWrapper $columns={columns || 1} ref={ref} data-testid="@wallet/fee-details">
                {feeOptions.map(fee => (
                    <FeeCard
                        key={fee.value}
                        value={fee.value}
                        isSelected={selectedLevel.label === fee.value}
                        changeFeeLevel={changeFeeLevel}
                        topLeftChild={
                            <span data-testid={`@fee-card/${fee.value}`}>
                                <Translation id={getFeeLevelTranslationId(fee.value)} />
                            </span>
                        }
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
                                feeRate={isEip1559(fee) ? fee.maxFeePerGas : fee.feePerUnit}
                                networkType={networkType}
                                symbol={symbol}
                            />
                        }
                    />
                ))}
            </FeeCardsWrapper>
        );
    },
);
