import { Translation } from 'src/components/suite/Translation';

interface ApyValueProps {
    apy?: number | null;
}

export const ApyValue = ({ apy }: ApyValueProps) => {
    if (!apy) {
        return <Translation id="TR_STAKE_NOT_AVAILABLE" />;
    }

    return <>~{apy}%</>;
};
