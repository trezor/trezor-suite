// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

export type MessageKey = keyof MessageType;

export type MessagePayload<T extends MessageKey = MessageKey> = MessageType[T];

export type MessageResponse<T extends MessageKey = MessageKey> = T extends any
    ? {
          type: T;
          message: MessagePayload<T>;
      }
    : never;

export type TypedCall = {
    <T extends MessageKey, R extends MessageKey[]>(
        type: T,
        resType: R,
        message?: MessagePayload<T>,
    ): Promise<MessageResponse<R[number]>>;
    <T extends MessageKey, R extends MessageKey>(
        type: T,
        resType: R,
        message?: MessagePayload<T>,
    ): Promise<MessageResponse<R>>;
};
