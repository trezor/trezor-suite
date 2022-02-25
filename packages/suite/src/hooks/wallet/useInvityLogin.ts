import { useCallback, useContext, useEffect, useState } from 'react';
import type {
    InvityLoginValues,
    UseInvityLoginProps,
} from '@wallet-types/coinmarket/savings/login';
import { useInvityNavigation } from '@wallet-hooks/useInvityNavigation';
import { InvityAuthenticationContext } from '@wallet-components/InvityAuthentication';

export const useInvityLogin = ({ selectedAccount }: UseInvityLoginProps): InvityLoginValues => {
    const { iframeMessage } = useContext(InvityAuthenticationContext);
    const { navigateToInvityRegistration, navigateToInvityRecovery } = useInvityNavigation(
        selectedAccount.account,
    );
    const [iframeHeight, setIframeHeight] = useState<number>(0);
    const [isFrameLoading, setIsIframeLoading] = useState(true);

    useEffect(() => {
        if (iframeMessage?.action === 'resize') {
            setIframeHeight(iframeMessage.data);
        }
        if (iframeMessage?.action === 'loaded') {
            setIsIframeLoading(false);
        }
        if (iframeMessage?.action === 'login-successful') {
            setIsIframeLoading(true);
        }
    }, [iframeMessage]);

    const handleCreateAnAccountClick = useCallback(
        () => navigateToInvityRegistration(),
        [navigateToInvityRegistration],
    );
    const handleForgotPasswordClick = useCallback(
        () => navigateToInvityRecovery(),
        [navigateToInvityRecovery],
    );

    return {
        iframeHeight,
        isFrameLoading,
        handleCreateAnAccountClick,
        handleForgotPasswordClick,
    };
};
