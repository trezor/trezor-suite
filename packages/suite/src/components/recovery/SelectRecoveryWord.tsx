import { selectRecoveryWordRequestInputType } from '@suite/modal';

import { useSelector } from '../../hooks/suite';
import { WordInput, WordInputAdvanced } from '../suite';

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
