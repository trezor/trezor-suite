export interface ValidatorsQueue {
    validatorsEnteringNum: number;
    validatorsExitingNum: number;
    validatorsTotalCount: number;
    validatorsPerEpoch: number;
    validatorActivationTime: number;
    validatorExitTime: number;
    validatorWithdrawTime: number;
    validatorAddingDelay: number;
    updatedAt: number;
}

export type ValidatorsQueueState = ValidatorsQueue | Record<string, never>;
