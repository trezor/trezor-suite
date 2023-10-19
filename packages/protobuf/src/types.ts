import * as Messages from './messages';

export type MessageFromTrezor = {
    type: keyof Messages.MessageType;
    message: Record<string, unknown>;
};
