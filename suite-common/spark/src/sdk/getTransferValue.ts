type SparkTransferRecord = Record<string, unknown>;

export const getTransferValue = (transfer: SparkTransferRecord) => {
    const { totalValue } = transfer;

    if (typeof totalValue === 'bigint') {
        return totalValue.toString();
    }

    if (typeof totalValue === 'number') {
        return totalValue.toString();
    }

    if (typeof totalValue === 'string') {
        return totalValue;
    }

    return '0';
};
