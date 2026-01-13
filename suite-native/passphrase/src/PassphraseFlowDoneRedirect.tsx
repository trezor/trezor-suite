import { useRedirectOnPassphraseCompletion } from '@suite-native/passphrase';

export const PassphraseFlowDoneRedirect = ({ children }: { children?: React.ReactNode }) => {
    useRedirectOnPassphraseCompletion();

    return children ?? null;
};
