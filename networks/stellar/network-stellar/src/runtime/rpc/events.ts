import { Address, nativeToScVal, scValToNative, type xdr } from '@stellar/stellar-sdk';

import { arrayChunk } from '@trezor/utils';

import type { StellarRpcServer } from '../../types/rpc';

/** One SEP-41 `transfer` event that moved the token to or from the account, as the node still holds it. */
export type StellarContractTokenTransfer = {
    contract: string;
    txHash: string;
    ledger: number;
    /** Unix seconds. */
    closedAt: number;
    from: string;
    to: string;
    /** Base units. */
    amount: string;
};

export type ReadContractTokenTransfersParams = {
    server: StellarRpcServer;
    account: string;
    contractIds: string[];
};

// The RPC caps a filter at five contracts and a request at five filters.
const CONTRACTS_PER_FILTER = 5;
const FILTERS_PER_REQUEST = 5;
const EVENTS_PAGE_SIZE = 200;
// An account's own transfers are few; this is a guard, not a budget.
const MAX_EVENT_PAGES = 5;

const symbolTopic = (name: string) => nativeToScVal(name, { type: 'symbol' }).toXdr('base64');
const addressTopic = (address: string) => Address.fromString(address).toScVal().toXdr('base64');

const readAddress = (topic: xdr.ScVal | undefined) => {
    try {
        return topic ? Address.fromScVal(topic).toString() : undefined;
    } catch {
        return undefined;
    }
};

// Since protocol 23 the event value is `{ amount, to_muxed_id }`; older tokens emit the bare i128.
const readAmount = (value: xdr.ScVal): string | undefined => {
    const native: unknown = scValToNative(value);
    const amount =
        typeof native === 'object' && native !== null && 'amount' in native
            ? native.amount
            : native;

    return typeof amount === 'bigint' || typeof amount === 'number' ? amount.toString() : undefined;
};

/**
 * Horizon attributes a Soroban call to its source and its signers only, and reports the balances a
 * call moved for classic assets alone: a token received through a contract never appears in the
 * recipient's operations, and one sent through a contract appears without its amount. The token's
 * own `transfer` events carry both, so both directions are read here. The node keeps them for its
 * retention window, so this reaches back as far as it can and no further.
 */
export const readContractTokenTransfers = async ({
    server,
    account,
    contractIds,
}: ReadContractTokenTransfersParams): Promise<StellarContractTokenTransfer[]> => {
    if (contractIds.length === 0) {
        return [];
    }

    const { oldestLedger } = await server.getHealth();
    const transfer = symbolTopic('transfer');
    const party = addressTopic(account);
    // Received, then sent; a filter matches an event on any one of its topic patterns.
    const topics = [
        [transfer, '*', party, '**'],
        [transfer, party, '*', '**'],
    ];
    const filters = arrayChunk([...new Set(contractIds)], CONTRACTS_PER_FILTER).map(ids => ({
        type: 'contract' as const,
        contractIds: ids,
        topics,
    }));

    const transfers: StellarContractTokenTransfer[] = [];
    // A transfer to the account from itself matches both patterns.
    const seen = new Set<string>();

    for (const requestFilters of arrayChunk(filters, FILTERS_PER_REQUEST)) {
        let cursor: string | undefined;

        for (let page = 0; page < MAX_EVENT_PAGES; page++) {
            const response = await server.getEvents({
                ...(cursor ? { cursor } : { startLedger: oldestLedger }),
                filters: requestFilters,
                limit: EVENTS_PAGE_SIZE,
            });

            response.events.forEach(event => {
                const contract = event.contractId?.contractId();
                const [, fromTopic, toTopic] = event.topic;
                const from = readAddress(fromTopic);
                const to = readAddress(toTopic);
                const amount = readAmount(event.value);

                // Protocol 23 nodes no longer send the flag; only an explicit failure is a skip.
                if (
                    event.inSuccessfulContractCall === false ||
                    !contract ||
                    !from ||
                    !to ||
                    !amount ||
                    seen.has(event.id)
                ) {
                    return;
                }

                seen.add(event.id);

                transfers.push({
                    contract,
                    txHash: event.txHash,
                    ledger: event.ledger,
                    closedAt: Math.floor(Date.parse(event.ledgerClosedAt) / 1000),
                    from,
                    to,
                    amount,
                });
            });

            if (response.events.length < EVENTS_PAGE_SIZE) {
                break;
            }
            cursor = response.cursor;
        }
    }

    // Newest first, and ordered within a ledger, so a page can stop at a transfer and resume there.
    return transfers.sort((a, b) => b.ledger - a.ledger || a.txHash.localeCompare(b.txHash));
};
