import { Translation, type TxKeyPath } from '@suite-native/intl';

type StakingDaysLabelProps = {
    days: number | null;
    withDaysId: TxKeyPath;
    withoutDaysId: TxKeyPath;
};

// A period that is not cached yet omits its day count instead of a fallback.
export const StakingDaysLabel = ({ days, withDaysId, withoutDaysId }: StakingDaysLabelProps) =>
    days === null ? (
        <Translation id={withoutDaysId} />
    ) : (
        <Translation id={withDaysId} values={{ days }} />
    );
