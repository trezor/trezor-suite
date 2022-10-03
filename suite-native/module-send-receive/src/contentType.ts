export const sendReceiveContentType = {
    chooseAction: 'chooseAction',
    selectAccountToReceive: 'selectAccountToReceive',
    selectAccountToSend: 'selectAccountToSend',
} as const;

export type SendReceiveContentType = keyof typeof sendReceiveContentType;
