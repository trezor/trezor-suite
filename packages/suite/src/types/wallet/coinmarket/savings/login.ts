import type { WithSelectedAccountLoadedProps } from '@wallet-components';

export type UseInvityLoginProps = WithSelectedAccountLoadedProps;

export interface InvityLoginValues {
    iframeHeight: number;
    isFrameLoading: boolean;
    handleCreateAnAccountClick: () => void;
    handleForgotPasswordClick: () => void;
}
