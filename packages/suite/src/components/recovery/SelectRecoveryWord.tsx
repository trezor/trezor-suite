import { selectRecoveryWordRequestInputType } from '@suite/modal';
import { useSelector } from '@suite-common/redux-utils';

import { WordInput, WordInputAdvanced } from 'src/components/suite';
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
