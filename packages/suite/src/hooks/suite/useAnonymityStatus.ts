import { useSelector } from './useSelector';
import { AnonymityStatus } from 'src/constants/suite/coinjoin';
import { selectCurrentTargetAnonymity } from 'src/reducers/wallet/coinjoinReducer';

const getAnonymityStatus = (targetAnonymity: number) => {
    if (targetAnonymity < AnonymityStatus.Bad) {
        return AnonymityStatus.Bad;
    }
    if (targetAnonymity < AnonymityStatus.Medium) {
        return AnonymityStatus.Medium;
    }
    if (targetAnonymity < AnonymityStatus.Good) {
        return AnonymityStatus.Good;
    }

    return AnonymityStatus.Great;
};

export const useAnonymityStatus = () => {
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity) || 1;

    const anonymityStatus = getAnonymityStatus(targetAnonymity);

    return {
        anonymityStatus,
        targetAnonymity,
    };
};
