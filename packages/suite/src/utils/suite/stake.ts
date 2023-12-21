import { StakeFormState } from '@suite-common/wallet-types';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';

interface GetStakeFormsDefaultValuesParams {
    address: string;
    ethereumStakeType: StakeFormState['ethereumStakeType'];
}

export const getStakeFormsDefaultValues = ({
    address,
    ethereumStakeType,
}: GetStakeFormsDefaultValuesParams) => ({
    fiatInput: '',
    cryptoInput: '',
    outputs: [
        {
            ...DEFAULT_PAYMENT,
            address,
        },
    ],
    options: ['broadcast'],

    ethereumStakeType,
    ethereumNonce: '',
    ethereumDataAscii: '',
    ethereumDataHex: '',

    estimatedFeeLimit: undefined,
    feeLimit: '',
    feePerUnit: '',
    selectedFee: undefined,
});
