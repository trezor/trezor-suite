export const getOutputState = (index: number, buttonRequestsCount: number) => {
    if (index === buttonRequestsCount - 1) return 'active';
    if (index < buttonRequestsCount - 1) return 'success';
    return undefined;
};
