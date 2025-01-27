import { useSetAtom } from 'jotai';

import { hideAlertAtom, showAlertAtom } from './alertsAtoms';

export const useAlert = () => {
    const showAlert = useSetAtom(showAlertAtom);
    const hideAlert = useSetAtom(hideAlertAtom);

    return { showAlert, hideAlert };
};
