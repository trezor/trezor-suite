import type { SendFeeModel } from './SendFee';
import type { SendFieldDeclaration } from './SendField';

/**
 * The interface a network family defines for its platform implementations: which send-form
 * features it has and how they behave. Platforms supply components for it, checked against it by
 * `NetworkConfigurationImplementation`. Declare it with `as const satisfies NetworkConfiguration`
 * so the field ids and the `selectable` flag stay literal.
 *
 * Not to be confused with `SuiteCommonNetworkConfig`, the per-symbol metadata kept in Redux.
 */
export type NetworkConfiguration = {
    /** Family key, e.g. `bitcoin`; namespaces everything the family contributes. */
    readonly key: string;
    /** Symbols the configuration applies to; platform registries look modules up by these. */
    readonly supportedNetworks: readonly string[];
    readonly send: {
        readonly fields: readonly SendFieldDeclaration[];
        readonly fee: SendFeeModel;
    };
};
