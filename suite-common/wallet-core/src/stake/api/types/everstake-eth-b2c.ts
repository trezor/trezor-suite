import zod from 'zod';

import { ValidatorsQueueResponse } from '../schemas/everstake-eth-b2c';

type ValidatorsQueueResponse = zod.infer<typeof ValidatorsQueueResponse>;

export type EthereumValidatorsQueue = {
    validatorActivationTime: ValidatorsQueueResponse['validator_activation_time'];
    validatorExitTime: ValidatorsQueueResponse['validator_exit_time'];
    validatorWithdrawTime: ValidatorsQueueResponse['validator_withdraw_time'];
    validatorAddingDelay: ValidatorsQueueResponse['validator_adding_delay'];
    updatedAt: ValidatorsQueueResponse['updated_at'];
};
