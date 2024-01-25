import { useAtomValue } from 'jotai';

import { PassphraseFormModal } from './PassphraseFormModal';
import { isPassphraseModalVisibleAtom } from './isPassphraseModalVisibleAtom';

export const PassphraseModalRenderer = () => {
    const isPassphraseModalVisible = useAtomValue(isPassphraseModalVisibleAtom);

    if (!isPassphraseModalVisible) return null;

    return <PassphraseFormModal />;
};
