// Request to execute a Connect method in Core
export const CORE_CALL = 'iframe-call' as const; // Keep old name for backward compatibility.

// Request to cancel an in-progress Core method call
export const CORE_CALL_CANCEL = 'core-call-cancel' as const;
