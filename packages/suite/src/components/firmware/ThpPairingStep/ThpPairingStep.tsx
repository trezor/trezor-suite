import { ReactNode } from 'react';

import { ThpStep } from '@suite-common/thp';
import { exhaustive } from '@trezor/type-utils';

import { ThpCodeEntryStep } from './ThpCodeEntryStep';
import { ThpCodeInvalidStep } from './ThpCodeInvalidStep';
import { ThpPairingConfirmStep } from './ThpPairingConfirmStep';
import { ThpPairingStartStep } from './ThpPairingStartStep';

// reflection of components/onboarding/ThpPairingStep/ThpPairingStep.tsx
export const ThpPairingStep = ({
    thpStep,
    heading,
}: {
    thpStep: NonNullable<ThpStep>;
    heading: ReactNode;
}) => {
    switch (thpStep) {
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
            exhaustive(thpStep);
    }
};
