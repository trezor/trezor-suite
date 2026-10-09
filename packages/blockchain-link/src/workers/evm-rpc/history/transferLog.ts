import { TRANSFER_TOPIC } from './constants';

export type TransferLogFields = {
    address: string;
    topics: readonly (string | null | undefined)[];
    data: string;
};

export type ParsedTransfer = {
    contract: string;
    from: string;
    to: string;
    value: bigint;
};

const topicToAddress = (topic: string) => `0x${topic.slice(-40).toLowerCase()}`;

/**
 * Only fungible transfers. `Transfer(address,address,uint256)` carries the amount in `data` with
 * three topics, while the ERC-721 event of the same name indexes the token id into a fourth topic
 * and leaves `data` empty - those are dropped, since this worker serves no NFT-enabled network.
 *
 * Receipts carry every event of a transaction, and other events share that shape - a Uniswap V3
 * `Swap(sender, recipient, int256 amount0, ...)` would read as a transfer of `2^256 - amount` to
 * the recipient - so the event signature has to match too.
 */
export const parseTransferLog = (log: TransferLogFields): ParsedTransfer | undefined => {
    if (log.topics.length !== 3 || log.data.length < 66) return undefined;

    const [eventTopic, fromTopic, toTopic] = log.topics;
    if (eventTopic?.toLowerCase() !== TRANSFER_TOPIC || !fromTopic || !toTopic) return undefined;

    let value: bigint;
    try {
        value = BigInt(log.data.slice(0, 66));
    } catch {
        return undefined;
    }

    return {
        contract: log.address.toLowerCase(),
        from: topicToAddress(fromTopic),
        to: topicToAddress(toTopic),
        value,
    };
};
