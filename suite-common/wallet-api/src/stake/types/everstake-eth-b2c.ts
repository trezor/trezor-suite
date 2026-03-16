import type zod from 'zod';

import { type ValidatorsQueueResponse } from '../schemas/everstake-eth-b2c';

type ValidatorsQueueResponse = zod.infer<typeof ValidatorsQueueResponse>;

export type EthereumValidatorsQueue = {
    validatorActivationTime: ValidatorsQueueResponse['validator_activation_time'];
    validatorExitTime: ValidatorsQueueResponse['validator_exit_time'];
    validatorWithdrawTime: ValidatorsQueueResponse['validator_withdraw_time'];
    validatorAddingDelay: ValidatorsQueueResponse['validator_adding_delay'];
    updatedAt: ValidatorsQueueResponse['updated_at'];
};

export type EthereumPoolStats = {
    /**
     * @example 3.08
     */
    ethApy: number;
    /**
     * Number of days to next reward payout
     */
    nextRewardPayout: number;
};
