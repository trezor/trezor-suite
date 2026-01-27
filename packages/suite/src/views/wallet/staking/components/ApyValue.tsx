import { Translation } from '@suite/intl';

interface ApyValueProps {
    apy?: number | null;
}

export const ApyValue = ({ apy }: ApyValueProps) => {
    if (!apy) {
        return <Translation id="TR_EARN_NOT_AVAILABLE" />;
    }

    return <>~{apy}%</>;
};
