import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NetworkComponentMap } from './NetworkComponentMap';
import type { SendFeeModel } from './SendFee';
import type { SendFieldDeclaration } from './SendField';
import type { SendStrategy } from './SendStrategy';

/** A declared field paired with the component one platform renders it with. */
export type SendFieldContribution<TComponent> = {
    readonly declaration: SendFieldDeclaration;
    readonly component: TComponent;
};

/** Everything a platform's generic send form needs to render one network: data, behaviour, slots. */
export type NetworkSendModule<TComponents extends NetworkComponentMap> = {
    readonly fee: SendFeeModel;
    readonly strategy: SendStrategy;
    readonly fields: readonly SendFieldContribution<TComponents['sendField']>[];
    readonly feeSelector?: TComponents['sendFeeSelector'];
};

/**
 * What a platform's registry sees of a network: its symbols and its contributions, with the
 * network-specific types erased. Platforms wrap this with their own component types.
 *
 * @serviceContract
 */
export type SuitePlatformNetworkModule<TComponents extends NetworkComponentMap> = {
    getSupportedNetworks: () => readonly NetworkSymbol[];
    getSend: () => NetworkSendModule<TComponents>;
};
