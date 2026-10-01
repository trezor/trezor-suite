import type { ComponentType } from 'react';

import type {
    NetworkComponentMap,
    SendFeeLevel,
    SendFieldValidationError,
} from '@trezor/network-module-suite-common-types';

/**
 * Props the generic native send form hands to a network's field component. The form owns the
 * value, validates it with the declared rule and passes the result; the component only renders.
 */
export type NativeSendFieldProps = {
    value: string;
    onChange: (value: string) => void;
    error?: SendFieldValidationError;
};

/** Props of a network's fee selector; levels come from the network's strategy. */
export type NativeSendFeeSelectorProps = {
    levels: readonly SendFeeLevel[];
    selectedLevelId: string;
    onSelect: (levelId: string) => void;
};

export type NativeNetworkComponents = NetworkComponentMap & {
    readonly sendField: ComponentType<NativeSendFieldProps>;
    readonly sendFeeSelector: ComponentType<NativeSendFeeSelectorProps>;
};
