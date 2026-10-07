interface BuildContractParams {
    ownerHex: string;
    recipientHex: string;
}

interface BuildTriggerContractParams extends BuildContractParams {
    data: string;
}

interface BuildTransferContractParams extends BuildContractParams {
    amount: string;
}

export const buildTriggerContract = ({
    ownerHex,
    recipientHex,
    data,
}: BuildTriggerContractParams) =>
    ({
        type: 'TriggerSmartContract' as const,
        parameter: {
            value: {
                owner_address: ownerHex,
                contract_address: recipientHex,
                data,
            },
        },
    }) as const;

export const buildTransferContract = ({
    ownerHex,
    recipientHex,
    amount,
}: BuildTransferContractParams) =>
    ({
        type: 'TransferContract' as const,
        parameter: {
            value: {
                owner_address: ownerHex,
                to_address: recipientHex,
                amount,
            },
        },
    }) as const;
