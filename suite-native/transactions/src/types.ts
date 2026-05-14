import { type TxTargetId } from '@suite-common/wallet-types';

export type AddressesType = 'inputs' | 'outputs';

/**
 * @deprecated Use Target. This is bitcoin-centric and does not work
 *             for other types of transaction well
 */
export type VinVoutAddress = {
    address: string;
    isChangeAddress: boolean;
    outputIndex: number;
    txTargetId: TxTargetId;
};
