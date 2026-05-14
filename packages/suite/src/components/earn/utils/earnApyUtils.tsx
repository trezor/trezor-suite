import { Translation } from '@suite/intl';

export const getApyRate = (apyRate: number): number =>
    Number.isFinite(apyRate) ? apyRate : Number.NEGATIVE_INFINITY;

export const formatApyValue = (apy?: number | null) => {
    if (apy == null) {
        return <Translation id="TR_EARN_APY_N_A" />;
    }

    return `${apy}`;
};
