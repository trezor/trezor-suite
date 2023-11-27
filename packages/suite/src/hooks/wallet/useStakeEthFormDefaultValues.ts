import { useMemo } from 'react';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { StakeEthFormState } from 'src/types/wallet/stakeEthForm';

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
            }) as StakeEthFormState,
        [defaultAddress],
    );

    return { defaultValues };
};
