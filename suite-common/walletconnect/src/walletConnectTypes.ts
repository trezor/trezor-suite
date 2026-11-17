import { type WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';

import { type Account } from '@suite-common/wallet-types';

export type WalletConnectRequestParams = {
    event: WalletKitTypes.SessionRequest;
    session: WalletConnectSession;
};

/** @serviceContract */
export interface WalletConnectAdapter {
    networkType: string;
    namespaceId: string;
    methods: string[];
    handleRequest: (params: WalletConnectRequestParams) => Promise<unknown>;
    getNamespace: (accounts: Account[]) => Record<string, WalletConnectNamespace>;
    processNamespaces: (
        accounts: Account[],
        networks: PendingConnectionProposalNetwork[],
        namespaces: ProposalTypes.RequiredNamespaces,
        required: boolean,
    ) => void;
}

export type WalletConnectAdaptersDep = {
    walletConnectAdapters: WalletConnectAdapter[];
};

export interface WalletConnectNamespace {
    chains: string[];
    methods: string[];
    events: string[];
    accounts: string[];
}

export interface WalletConnectSession {
    topic: string;
    validation?: 'VALID' | 'INVALID' | 'UNKNOWN';
    namespaces: Record<string, Partial<WalletConnectNamespace>>;
    peer: {
        metadata: {
            name: string;
            url: string;
            icons: string[];
        };
    };
    lastAccount?: Account;
}

export interface PendingConnectionProposalNetwork {
    namespaceId: string;
    symbol?: string;
    name: string;
    status: 'active' | 'inactive' | 'unsupported';
    required: boolean;
}

export interface PendingConnectionProposal {
    eventId: number;
    params: ProposalTypes.Struct;
    origin: string;
    validation: 'UNKNOWN' | 'VALID' | 'INVALID';
    isScam?: boolean;
    expired: boolean;
    networks: PendingConnectionProposalNetwork[];
}
