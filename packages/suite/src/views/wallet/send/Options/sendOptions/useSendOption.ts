import { useWatch } from 'react-hook-form';

import type { FormOptions } from '@suite-common/wallet-types';

import { useSendFormContext } from '#src/hooks/wallet';

/** Whether the user turned an option on, and how to turn it off or on again. */
export const useSendOption = (option: FormOptions) => {
    const { control, toggleOption, composeTransaction } = useSendFormContext();
    const enabled = useWatch({ name: 'options', control }) ?? [];

    return {
        isEnabled: enabled.includes(option),
        toggle: () => {
            toggleOption(option);
            composeTransaction();
        },
    };
};
