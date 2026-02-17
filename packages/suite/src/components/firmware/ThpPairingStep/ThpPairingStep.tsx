import { ReactNode, useRef } from 'react';

import { selectThpStep } from '@suite-common/thp';

import { useSelector } from 'src/hooks/suite';

import { ThpCodeEntryStep } from './ThpCodeEntryStep';
import { ThpCodeInvalidStep } from './ThpCodeInvalidStep';
import { ThpPairingConfirmStep } from './ThpPairingConfirmStep';
import { ThpPairingStartStep } from './ThpPairingStartStep';

// reflection of components/onboarding/ThpPairingStep/ThpPairingStep.tsx
export const ThpPairingStep = ({ heading }: { heading: ReactNode }) => {
    const thpStep = useSelector(selectThpStep);
    const prevStepRef = useRef(thpStep);
    if (thpStep) {
        prevStepRef.current = thpStep;
    }

    // render thpState if set or last known step. fallback to ThpPairingStartStep with loader
    const step = thpStep ?? prevStepRef.current;
    switch (step) {
        case 'BeforeConnectionInfo':
            return <ThpPairingStartStep modalHeading={heading} />;
        case 'ConfirmOnlyConnection':
        case 'ConfirmConnectionBeforePairing':
            return <ThpPairingConfirmStep modalHeading={heading} />;
        case 'CodeEntry':
            return <ThpCodeEntryStep modalHeading={heading} />;
        case 'CodeInvalid':
            return <ThpCodeInvalidStep modalHeading={heading} />;

        default:
            return <ThpPairingStartStep modalHeading={heading} isLoading />;
    }
};
