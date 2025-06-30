export const getSimulationErrorRiskLevel = (message: string) => {
    if (message.includes('Unsupported EIP-712 message type')) {
        return 'warning';
    }

    return 'error';
};
