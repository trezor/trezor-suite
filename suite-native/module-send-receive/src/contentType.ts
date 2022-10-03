export const sendReceiveContentType = {
    chooseAction: 'chooseAction',
    selectAccountToReceive: 'selectAccountToReceive',
    selectAccountToSend: 'selectAccountToSend',
    createNewAddressToReceive: 'createNewAddressToReceive',
    confirmNewAddressToReceive: 'confirmNewAddressToReceive',
    generatedAddressToReceive: 'generatedAddressToReceive',
} as const;

export type SendReceiveContentType = keyof typeof sendReceiveContentType;
