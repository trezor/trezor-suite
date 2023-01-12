import * as Messages from './messages';

export type MessageFromTrezor = {
    type: keyof Messages.MessageType;
    message: Record<string, unknown>;
};

export type Session = null | string;
export type Descriptor = { path: string; session?: Session };
