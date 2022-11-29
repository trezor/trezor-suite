export const sendReceiveContentType = {
    selectAccountToReceive: 'selectAccountToReceive',
    createNewAddressToReceive: 'createNewAddressToReceive',
    confirmNewAddressToReceive: 'confirmNewAddressToReceive',
    generatedAddressToReceive: 'generatedAddressToReceive',
} as const;

export type SendReceiveContentType = keyof typeof sendReceiveContentType;
