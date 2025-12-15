import { Translation } from '@suite/intl';

export const formatApyValue = (apy?: number | null) => {
    if (apy == null) {
        return <Translation id="TR_STAKE_N_A" />;
    }

    return `${apy}`;
};
