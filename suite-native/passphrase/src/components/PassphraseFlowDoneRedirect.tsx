import { type ReactNode } from 'react';

import { useRedirectOnPassphraseCompletion } from '../useRedirectOnPassphraseCompletion';

export const PassphraseFlowDoneRedirect = ({ children }: { children?: ReactNode }) => {
    useRedirectOnPassphraseCompletion();

    return children ?? null;
};
