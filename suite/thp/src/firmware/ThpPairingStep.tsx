import { type ReactNode, useRef } from 'react';
import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';
import { Column, Image, Modal } from '@trezor/components';

import { ThpCodeEntryStep } from './ThpCodeEntryStep';
import { ThpCodeInvalidStep } from './ThpCodeInvalidStep';
import { ThpPairingConfirmStep } from './ThpPairingConfirmStep';
import { ThpPairingStartStep } from './ThpPairingStartStep';

// reflection of packages/suite/src/components/onboarding/ThpPairingStep/ThpPairingStep.tsx
export const ThpPairingStep = ({ heading }: { heading: ReactNode }) => {
    const device = useSelector(selectSelectedDevice);
    const thpStep = useSelector(selectThpStep);
    const prevStepRef = useRef(thpStep);
    if (thpStep) {
        prevStepRef.current = thpStep;
    }

    if (!device?.connected) {
        return (
            <Modal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                onCancel={undefined}
                data-testid="@firmware-modal/no-device"
            >
                <Column alignItems="center">
                    <Image image="CONNECT_DEVICE" />
                </Column>
            </Modal>
        );
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
