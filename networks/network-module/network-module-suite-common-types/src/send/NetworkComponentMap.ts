/**
 * The component kinds a platform supplies for a network configuration. Each platform fixes the
 * concrete component types (props included); `unknown` here keeps this package free of React.
 */
export type NetworkComponentMap = {
    readonly sendField: unknown;
    readonly sendFeeSelector: unknown;
};
