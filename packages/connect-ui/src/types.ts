import { PopupHandshake, PopupMethodInfo, IFrameLoaded } from '@trezor/connect';
import type { Core } from '@trezor/connect/lib/core';

export type State = Partial<PopupHandshake['payload']> &
    Partial<PopupMethodInfo['payload']> &
    Partial<IFrameLoaded['payload']> & {
        iframe?: Window;
        broadcast?: BroadcastChannel;
        core?: Core;
        // preferred device will appear here
    };

export const getDefaultState = (): State => ({});
