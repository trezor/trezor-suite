import { type AsyncThunk } from '@reduxjs/toolkit';
import { type WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';

import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

export interface WalletConnectAdapter {
    networkType: string;
    namespaceId: string;
    methods: string[];
    requestThunk: AsyncThunk<any, { event: WalletKitTypes.SessionRequest }, any>;
    getChainId: (network: Network) => string[];
    getNamespace: (accounts: Account[]) => Record<string, WalletConnectNamespace>;
    processNamespaces: (
        accounts: Account[],
        networks: PendingConnectionProposalNetwork[],
        namespaces: ProposalTypes.RequiredNamespaces,
        required: boolean,
    ) => void;
}

export interface WalletConnectNamespace {
    chains: string[];
    methods: string[];
    events: string[];
    accounts: string[];
}

export interface WalletConnectSession {
    topic: string;
    validation?: 'VALID' | 'INVALID' | 'UNKNOWN';
    pairingTopic: string;
    expiry: number;
    acknowledged: boolean;
    namespaces: Record<string, Partial<WalletConnectNamespace>>;
    requiredNamespaces: ProposalTypes.RequiredNamespaces;
    optionalNamespaces: ProposalTypes.OptionalNamespaces;
    peer: {
        publicKey: string;
        metadata: {
            name: string;
            description: string;
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
    verifyUrl: string;
    isScam?: boolean;
    expired: boolean;
    networks: PendingConnectionProposalNetwork[];
}
