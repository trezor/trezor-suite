import { ReactNode } from 'react';

import { useAtomValue } from 'jotai';

import { PassphraseFormModal } from './PassphraseFormModal';
import { isPassphraseModalVisibleAtom } from './isPassphraseModalVisibleAtom';

type PassphraseModalRendererProps = {
    children: ReactNode;
};

export const PassphraseModalRenderer = ({ children }: PassphraseModalRendererProps) => {
    const isPassphraseModalVisible = useAtomValue(isPassphraseModalVisibleAtom);

    return (
        <>
            {children}
            {isPassphraseModalVisible && <PassphraseFormModal />}
        </>
    );
};
