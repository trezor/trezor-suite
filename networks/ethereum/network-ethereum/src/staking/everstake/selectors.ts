export const EVERSTAKE_SELECTORS = {
    stake: '0x3a29dbae',
    unstake: '0x76ec871c',
    claimWithdrawRequest: '0x33986ffa',
} as const;

export type EverstakeOperation = keyof typeof EVERSTAKE_SELECTORS;

const OPERATION_BY_SELECTOR: Readonly<Record<string, EverstakeOperation | undefined>> = {
    [EVERSTAKE_SELECTORS.stake]: 'stake',
    [EVERSTAKE_SELECTORS.unstake]: 'unstake',
    [EVERSTAKE_SELECTORS.claimWithdrawRequest]: 'claimWithdrawRequest',
};

export const getEverstakeOperationBySelector = (
    selector: string | undefined,
): EverstakeOperation | null => {
    if (!selector) return null;

    return OPERATION_BY_SELECTOR[selector.toLowerCase()] ?? null;
};
