export const hexStringByteLength = (s: string) => s.length / 2;

export const sendChunkedHexString = async (
    typedCall: any,
    data: string,
    chunkSize: number,
    messageType: string,
) => {
    let processedSize = 0;
    while (processedSize < data.length) {
        const chunk = data.slice(processedSize, processedSize + chunkSize);
        await typedCall(messageType, 'CardanoTxItemAck', {
            data: chunk,
        });
        processedSize += chunkSize;
    }
};
