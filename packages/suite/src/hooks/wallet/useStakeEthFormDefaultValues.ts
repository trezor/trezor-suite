import { useMemo } from 'react';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { StakeFormState } from '@suite-common/wallet-types';

export const useStakeEthFormDefaultValues = (defaultAddress?: string) => {
    const defaultValues = useMemo(
        () =>
            ({
                ...DEFAULT_VALUES,
                estimatedFeeLimit: undefined,
                fiatInput: '',
                cryptoInput: '',
                outputs: [
                    {
                        ...DEFAULT_PAYMENT,
                        address: defaultAddress,
                    },
                ],
                options: ['broadcast'],
                ethereumStakeType: 'stake',
            }) as StakeFormState,
        [defaultAddress],
    );

    return { defaultValues };
};
