import { useSetAtom } from 'jotai';

import { addToastAtom, removeToastAtom } from './toastsAtoms';

export const useToast = () => {
    const showToast = useSetAtom(addToastAtom);
    const hideToast = useSetAtom(removeToastAtom);

    return { showToast, hideToast };
};
