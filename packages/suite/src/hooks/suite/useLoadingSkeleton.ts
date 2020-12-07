import { useSelector } from '@suite-hooks';

export const useLoadingSkeleton = () => {
    const waitingForDevice = !useSelector(state => state.suite.device)?.state;
    const modalActive = useSelector(state => state.modal.context) !== '@modal/context-none';

    return {
        // Returns false if there is a modal window active or if we are waiting for a device.
        // For the latter there is no modal set in modal reducer,
        // instead standalone modal is rendered from Preloader (eg. DeviceConnect and other device-related modals, passphrase,...)
        shouldAnimate: !modalActive && !waitingForDevice,
    };
};
