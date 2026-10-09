import { TRANSFER_EVENT } from './constants';
import { type EventLogFields, decodeEventLogAs } from '../utils/eventLog';

export type ParsedTransfer = {
    contract: string;
    from: string;
    to: string;
    value: bigint;
};

/**
 * Only fungible transfers. The ERC-721 `Transfer` shares the ERC-20 selector but indexes the token
 * id into a fourth topic and leaves `data` empty, so it does not decode against the ERC-20 ABI -
 * which is fine, since this worker serves no NFT-enabled network.
 */
export const parseTransferLog = (log: EventLogFields): ParsedTransfer | undefined => {
    const decoded = decodeEventLogAs(TRANSFER_EVENT, log);
    if (!decoded) return undefined;

    const { from, to, value } = decoded.args;

    return {
        contract: log.address.toLowerCase(),
        from: from.toLowerCase(),
        to: to.toLowerCase(),
        value,
    };
};
