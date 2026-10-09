import { type AbiEvent, decodeEventLog, isHex } from 'viem';

export type EventLogFields = {
    address: string;
    topics: readonly (string | null | undefined)[];
    data: string;
};

/**
 * Decodes `log` as `event`, or returns undefined when the log is anything else. Logs are matched by
 * the ABI, never by their shape: the first topic must be the event's selector, each indexed input
 * needs exactly one topic and `data` must decode into the remaining inputs. Events that merely look
 * alike - two indexed addresses followed by a 32-byte word fit an ERC-20 `Transfer`, an `Approval`
 * and a Uniswap V3 `Swap` alike - therefore never pass for one another.
 */
export const decodeEventLogAs = <const TEvent extends AbiEvent>(
    event: TEvent,
    log: EventLogFields,
) => {
    const [signature, ...indexed] = log.topics;
    const indexedCount = event.inputs.filter(input => input.indexed).length;

    if (
        indexed.length !== indexedCount ||
        !isHex(signature) ||
        !indexed.every(topic => isHex(topic)) ||
        !isHex(log.data)
    ) {
        return undefined;
    }

    try {
        return decodeEventLog({
            abi: [event],
            topics: [signature, ...indexed],
            data: log.data,
            strict: true,
        });
    } catch {
        return undefined;
    }
};
