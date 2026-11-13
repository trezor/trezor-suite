import type { Label } from '../Label';
import type { OpenAccount } from '../OpenAccount';

/** The token a send moves, described only by what families read from it. */
export type SendToken = {
    readonly contract: string;
    /** The token standard as the backend reports it, such as `ERC20` or `STELLAR-CONTRACT`. */
    readonly standard?: string;
};

export type SendOptionsParams = {
    readonly account: OpenAccount;
    /** Absent when the send moves the network's own coin. */
    readonly token?: SendToken;
};

/** Why an option the network offers can't be used for this send right now. */
export type SendOptionUnavailable = {
    /** Shown where the option would be; absent when disabling it explains itself. */
    readonly reason?: Label;
};

/**
 * A short free-form value attached to the transaction: Ripple's destination tag, a Stellar or
 * Solana memo, a Tron note.
 */
export type SendMemo = {
    readonly label: Label;
    /**
     * `recipient`: shown with every recipient, because the receiving side, often an exchange,
     * needs it to credit the funds. `optional`: added on request, for the sender's own use.
     */
    readonly prominence: 'recipient' | 'optional';
    /** The action that adds it, such as "Add memo". */
    readonly addLabel: Label;
    readonly tooltip?: Label;
    /** A note shown with the field, such as a cost it adds. */
    readonly note?: Label;
    readonly maxLength: { readonly value: number; readonly unit: 'characters' | 'bytes' };
    /** Shown when the value is over `maxLength`; without it, only the counter turns red. */
    readonly tooLongMessage?: Label;
    /** Present when a send with the memo turned on but left empty is refused, with the reason. */
    readonly requiredMessage?: Label;
    /** The message for an invalid value, or `undefined` when it is valid. */
    validate(value: string): Label | undefined;
    readonly unavailable?: SendOptionUnavailable;
};

/** Arbitrary hex data sent along with a coin transfer, such as an EVM call. */
export type SendData = {
    readonly maxBytes: number;
    readonly unavailable?: SendOptionUnavailable;
};

/** Sending with a sequence number the user picks, such as an EVM nonce. */
export type SendNonceOverride = {
    readonly maxDigits: number;
};

/**
 * What a send can do beyond moving an amount to an address, for one account and the token it
 * moves. Each member is present exactly when the network offers it, so its presence is the support
 * check, and the members that are flags carry no parameters yet.
 */
export type SendOptionSet = {
    readonly memo?: SendMemo;
    readonly data?: SendData;
    readonly nonceOverride?: SendNonceOverride;
    /** Several recipients in one transaction. */
    readonly multipleRecipients?: true;
    /** Recipients imported from a file. */
    readonly importRecipients?: true;
    /** An OP_RETURN-style output that carries data and no amount. */
    readonly dataOutput?: true;
    /** A transaction that can't be mined before a block height or a time. */
    readonly locktime?: true;
    /** Picking which coins (UTXOs) the transaction spends. */
    readonly coinControl?: true;
    /** Signing without broadcasting, to broadcast the transaction elsewhere. */
    readonly broadcastToggle?: true;
};

/**
 * What a send can do on a network beyond an amount and an address. The send form renders each
 * present option the same way on every network; a family describes its own as data and never
 * renders anything.
 *
 * @serviceContract
 */
export type SendOptions = {
    getOptions(params: SendOptionsParams): SendOptionSet;
};
