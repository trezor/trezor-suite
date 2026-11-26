import { selectThpAutoconnectStep, selectThpStep } from '@suite-common/thp';
import { selectSelectedFirstThpDevice } from '@suite-common/wallet-core';
import { ModalLoader } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';
import { reportToSentryThunk } from '#src/utils/suite/sentry';

import { ThpStepModal } from './ThpStepModal';

export const ThpGlobalModalManager = () => {
    const { dispatch } = useServices(injectDispatch);
    const device = useSelector(selectSelectedFirstThpDevice);
    const thpStep = useSelector(selectThpStep);
    const thpAutoconnectStep = useSelector(selectThpAutoconnectStep);

    if (!device) {
        return null;
    }

    /** Device-driven, so nothing local to close: report it and leave the modal out. */
    return (
        <ModalLoader name="thp-step-modal" onError={error => dispatch(reportToSentryThunk(error))}>
            <ThpStepModal
                device={device}
                thpStep={thpStep}
                thpAutoconnectStep={thpAutoconnectStep}
            />
        </ModalLoader>
    );
};
