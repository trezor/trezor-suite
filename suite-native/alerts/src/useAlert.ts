import { useSetAtom } from 'jotai';

import { showAlertAtom, hideAlertAtom } from './alertsAtoms';

export const useAlert = () => {
    const showAlert = useSetAtom(showAlertAtom);
    const hideAlert = useSetAtom(hideAlertAtom);

    return { showAlert, hideAlert };
};
