import { selectRecoveryWordRequestInputType } from '@suite/modal';

import { WordInput } from '#src/components/suite/WordInput';
import { WordInputAdvanced } from '#src/components/suite/WordInputAdvanced';
import { useSelector } from '#src/hooks/suite';

export const SelectRecoveryWord = () => {
    const recoveryWordRequestInputType = useSelector(selectRecoveryWordRequestInputType);

    if (recoveryWordRequestInputType === 6 || recoveryWordRequestInputType === 9) {
        return <WordInputAdvanced count={recoveryWordRequestInputType} />;
    }

    if (recoveryWordRequestInputType === 'plain') {
        return <WordInput />;
    }

    return null;
};
