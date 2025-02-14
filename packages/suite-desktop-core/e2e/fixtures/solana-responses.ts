//Mocked responses from sol1.trazor.io

export const sendTransactionResponse = (id: string) => ({
    jsonrpc: '2.0',
    result: '2id3YC2jK9G5Wo2phDx4gJVAew8DcY5NAojnVuao8rkxwPYPe8cSwE5GzhEgJA2y8fVjDEo6iR6ykBvDxrTQrtpb',
    id,
});

export const getSignatureStatusesResponse = (id: string) => ({
    jsonrpc: '2.0',
    result: {
        context: {
            apiVersion: '2.1.11',
            slot: 320617838,
        },
        value: [
            {
                confirmationStatus: 'finalized',
                confirmations: null,
                err: null,
                slot: 320617838,
                status: {
                    Ok: null,
                },
            },
        ],
    },
    id,
});
