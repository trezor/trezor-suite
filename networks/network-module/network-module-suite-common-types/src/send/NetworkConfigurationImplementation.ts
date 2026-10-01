import type { NetworkComponentMap } from './NetworkComponentMap';
import type { NetworkConfiguration } from './NetworkConfiguration';
import type { SendStrategy } from './SendStrategy';

type DeclaredFieldId<TConfiguration extends NetworkConfiguration> =
    TConfiguration['send']['fields'][number]['id'];

type SendFeeSelectorImplementation<
    TConfiguration extends NetworkConfiguration,
    TComponents extends NetworkComponentMap,
> = TConfiguration['send']['fee']['selectable'] extends true
    ? { readonly feeSelector: TComponents['sendFeeSelector'] }
    : { readonly feeSelector?: never };

/**
 * What a platform must supply for a network's configuration: the strategy, exactly one component
 * per declared field, and a fee selector exactly when the fee model is selectable. A missing id is
 * a type error; an extra id is an excess-property error when the implementation is an object
 * literal.
 */
export type NetworkConfigurationImplementation<
    TConfiguration extends NetworkConfiguration,
    TComponents extends NetworkComponentMap,
> = {
    readonly send: {
        readonly strategy: SendStrategy;
        readonly fields: {
            readonly [TId in DeclaredFieldId<TConfiguration>]: TComponents['sendField'];
        };
    } & SendFeeSelectorImplementation<TConfiguration, TComponents>;
};
