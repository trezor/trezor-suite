import type { ComponentType } from 'react';

import type { NonceOverride } from '@trezor/network-module-suite-common-types';

export type NoncePanelProps = {
    nonce: NonceOverride;
    /** Clears the custom nonce and closes the panel. */
    onCancel: () => void;
};

/** The panels of the send options a family may present its own way. */
export type SendOptionPanels = {
    NoncePanel: ComponentType<NoncePanelProps>;
};
