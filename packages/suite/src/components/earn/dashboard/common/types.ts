import { type TokenAddress } from '@suite-common/tokens';

export type EarnTokenBalance = {
    value: string;
    /** The token the balance is in; without one, it is the native coin. */
    contractAddress?: TokenAddress;
};
