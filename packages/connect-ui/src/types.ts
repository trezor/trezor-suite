import { PopupHandshake, IFrameLoaded } from '@trezor/connect';

export type State = Partial<PopupHandshake['payload']> &
    Partial<IFrameLoaded['payload']> & {
        iframe?: Window;
        broadcast?: BroadcastChannel;
        // preferred device will appear here
    };

export const getDefaultState = (): State => ({});
