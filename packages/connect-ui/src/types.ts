import { PopupHandshake, PopupMethodInfo, IFrameLoaded } from '@trezor/connect';
import type { Core } from '@trezor/connect/lib/core';
import type { OriginBoundState } from '@trezor/connect-common';

export type State = Partial<PopupHandshake['payload']> &
    Partial<PopupMethodInfo['payload']> &
    Partial<IFrameLoaded['payload']> & {
        iframe?: Window;
        broadcast?: BroadcastChannel;
        core?: Core;
    } & Partial<OriginBoundState>;

export const getDefaultState = (): State => ({
    permissions: [],
});
