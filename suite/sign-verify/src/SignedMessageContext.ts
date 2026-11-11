import { createContext, useContext } from 'react';

import { type SignedMessage } from '@suite-common/sign-verify';

type SignedMessageContextValue = {
    /** What the device returned once the message is signed, until the form is cleared. */
    signedMessage: SignedMessage | undefined;
};

export const SignedMessageContext = createContext<SignedMessageContextValue | null>(null);

/** Lets the network's own parts of a `SignMessageForm` follow the signing. */
export const useSignedMessage = () => {
    const context = useContext(SignedMessageContext);

    if (!context) {
        throw new Error('useSignedMessage must be used inside SignMessageForm.');
    }

    return context.signedMessage;
};
