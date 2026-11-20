/**
 * Options for mutations that only cross IPC to the desktop host. React Query's default network mode
 * pauses a mutation while the system reports being offline, which would leave the native view on
 * screen after its region is gone, and the provider's production retries would replay a failed call
 * after the component that made it has unmounted.
 */
export const LOCAL_IPC_MUTATION_OPTIONS = { networkMode: 'always', retry: 0 } as const;
