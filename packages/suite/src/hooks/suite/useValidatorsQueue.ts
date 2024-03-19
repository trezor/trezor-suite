import { NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { useEffect, useState } from 'react';
import { ValidatorsQueueState } from 'src/types/wallet/stake';

export const useValidatorsQueue = (symbol: NetworkSymbol = 'eth') => {
    const [validatorsQueue, setValidatorsQueue] = useState<ValidatorsQueueState>({});
    const [isValidatorsQueueLoading, setIsValidatorsQueueLoading] = useState(false);

    useEffect(() => {
        const abortController = new AbortController();

        const getValidatorsQueue = async () => {
            try {
                setIsValidatorsQueueLoading(true);
                const response = await fetch(
                    `https://eth-api-b2c${isTestnet(symbol) ? '-stage' : ''}.everstake.one/api/v1/validators/queue`,
                    {
                        method: 'GET',
                        signal: abortController.signal,
                    },
                );

                const validatorsQueue = await response.json();

                if (!response.ok) {
                    throw new Error(`${response.status} ${validatorsQueue.message}`);
                }

                setValidatorsQueue({
                    validatorsEnteringNum: validatorsQueue.validators_entering_num,
                    validatorsExitingNum: validatorsQueue.validators_exiting_num,
                    validatorsTotalCount: validatorsQueue.validators_total_count,
                    validatorsPerEpoch: validatorsQueue.validators_per_epoch,
                    validatorActivationTime: validatorsQueue.validator_activation_time,
                    validatorExitTime: validatorsQueue.validator_exit_time,
                    validatorWithdrawTime: validatorsQueue.validator_withdraw_time,
                    validatorAddingDelay: validatorsQueue.validator_adding_delay,
                    updatedAt: validatorsQueue.updated_at,
                });
            } catch (e) {
                if (!abortController.signal.aborted) {
                    console.error(e);
                    setValidatorsQueue({});
                }
            } finally {
                setIsValidatorsQueueLoading(false);
            }
        };

        getValidatorsQueue();

        return () => {
            abortController.abort();
        };
    }, [symbol]);

    return { validatorsQueue, isValidatorsQueueLoading };
};
