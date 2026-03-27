import { type PublicClient, createPublicClient } from 'viem';

import { BaseWorker, CONTEXT } from '@trezor/blockchain-link';
import type { Response } from '@trezor/blockchain-link-types';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';

import { estimateFee } from './handlers/estimateFee';
import { getAccountInfo } from './handlers/getAccountInfo';
import { getBlock } from './handlers/getBlock';
import { getBlockHash } from './handlers/getBlockHash';
import { getInfo } from './handlers/getInfo';
import { getTransaction } from './handlers/getTransaction';
import { pushTransaction } from './handlers/pushTransaction';
import { rpcCall } from './handlers/rpcCall';
import { cleanupSubscriptions, subscribe, unsubscribe } from './handlers/subscribe';
import { validateRpcUrl } from './handlers/validateRpcUrl';
import type { Request } from './types';
import { getTransportType } from './utils/transportType';

const onRequest = (request: Request<MessageTypes.Message>) => {
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return getInfo(request);
        case MESSAGES.GET_BLOCK_HASH:
            return getBlockHash(request);
        case MESSAGES.GET_BLOCK:
            return getBlock(request);
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.ESTIMATE_FEE:
            return estimateFee(request);
        case MESSAGES.GET_TRANSACTION:
            return getTransaction(request);
        case MESSAGES.PUSH_TRANSACTION:
            return pushTransaction(request);
        case MESSAGES.SUBSCRIBE:
            return subscribe(request);
        case MESSAGES.UNSUBSCRIBE:
            return unsubscribe(request);
        case MESSAGES.RPC_CALL:
            return rpcCall(request);
        case MESSAGES.VALIDATE_EVM_RPC:
            return validateRpcUrl(request);
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

export class EvmRpcWorker extends BaseWorker<PublicClient> {
    cleanup() {
        cleanupSubscriptions();
        super.cleanup();
    }

    protected isConnected(client: PublicClient | undefined): client is PublicClient {
        return client !== undefined;
    }

    protected async tryConnect(url: string): Promise<PublicClient> {
        const transportType = getTransportType(url);

        if (!transportType) {
            throw new CustomError('invalid_param', 'Invalid URL');
        }

        this.state.url = url;
        const client = createPublicClient({
            transport: transportType(url),
        });

        await client.getChainId();

        this.post({ id: -1, type: RESPONSES.CONNECTED });

        return client;
    }

    disconnect(): void {
        this.cleanup();
    }

    async messageHandler(event: { data: MessageTypes.Message }) {
        try {
            if (await super.messageHandler(event)) return true;

            const request: Request<MessageTypes.Message> = {
                ...event.data,
                connect: () => this.connect(),
                post: (data: Response) => this.post(data),
                state: this.state,
                coinName: this.settings.name || 'ETH',
            };

            const response = await onRequest(request);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }
}

export default function EvmRpc() {
    return new EvmRpcWorker();
}

if (CONTEXT === 'worker') {
    const mod = new EvmRpcWorker();
    onmessage = mod.messageHandler.bind(mod);
}
