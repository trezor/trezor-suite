import { Suspense } from 'react';

import { selectThpAutoconnectStep, selectThpStep } from '@suite-common/thp';
import { selectSelectedFirstThpDevice } from '@suite-common/wallet-core';
import { ModalSkeleton } from '@trezor/components';

import { useSelector } from '#src/hooks/suite';

import { ThpStepModal } from './ThpStepModal';

export const ThpGlobalModalManager = () => {
    const device = useSelector(selectSelectedFirstThpDevice);
    const thpStep = useSelector(selectThpStep);
    const thpAutoconnectStep = useSelector(selectThpAutoconnectStep);

    if (!device) {
        return null;
    }

    return (
        <Suspense fallback={<ModalSkeleton />}>
            <ThpStepModal
                device={device}
                thpStep={thpStep}
                thpAutoconnectStep={thpAutoconnectStep}
            />
        </Suspense>
    );
};
