import { useRedirectOnPassphraseCompletion } from '../../useRedirectOnPassphraseCompletion';

export const PassphraseFlowDoneRedirect = ({ children }: { children?: React.ReactNode }) => {
    useRedirectOnPassphraseCompletion();

    return children ?? null;
};
