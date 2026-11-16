import type { Label } from '../Label';
import type { SendTransfer } from './SendToken';

/**
 * A short free-form value attached to the transaction: Ripple's destination tag, a Stellar or
 * Solana memo, a Tron note. The family states the network's rules for it; how and where it is
 * shown is the send form's decision.
 */
export type TransactionMemo = {
    /** What the network calls it and how to attach one, in the network's own words. */
    readonly labels: {
        readonly name: Label;
        readonly add: Label;
        readonly description?: Label;
        /** Something the user should know before attaching one, such as a fee it adds. */
        readonly notice?: Label;
    };
    /**
     * Whether receivers, typically exchanges, use it to tell deposits apart, so a send may need
     * one for any recipient.
     */
    readonly identifiesRecipient: boolean;
    /** The longest memo the network accepts, in UTF-8 bytes; absent when its format limits it. */
    readonly maxBytes?: number;
    /** Why the network would refuse this value, or `undefined`. An empty value is checked too. */
    validate(value: string): Label | undefined;
    /** Why no memo can go with this transfer, or `undefined` when one can. */
    getUnavailableReason(transfer: SendTransfer): Label | undefined;
};
