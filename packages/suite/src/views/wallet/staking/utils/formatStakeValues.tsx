import { Translation } from 'src/components/suite/Translation';

export const formatApyValue = (apy?: number | null) => {
    if (apy == null) {
        return <Translation id="TR_STAKE_N_A" />;
    }

    return `${apy}`;
};
