export const isEarnSigningCancelled = (error: { code?: string; message?: string }): boolean =>
    error.message !== 'tx-timeout' &&
    (error.message === 'tx-cancelled' ||
        ['Failure_ActionCancelled', 'Failure_PinCancelled', 'Method_Cancel'].includes(
            error.code ?? '',
        ));
