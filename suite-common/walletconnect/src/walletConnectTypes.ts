import { WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';

import { SuiteCompatibleThunk } from '@suite-common/redux-utils';

export interface WalletConnectAdapter {
    networkType: string;
    methods: string[];
    requestThunk: SuiteCompatibleThunk<{
        event: WalletKitTypes.SessionRequest;
    }>;
}

export interface WalletConnectNamespace {
    chains: string[];
    methods: string[];
    events: string[];
    accounts: string[];
}

export interface WalletConnectSession {
    topic: string;
    pairingTopic: string;
    expiry: number;
    acknowledged: boolean;
    namespaces: Record<string, Partial<WalletConnectNamespace>>;
    requiredNamespaces: ProposalTypes.RequiredNamespaces;
    optionalNamespaces: ProposalTypes.OptionalNamespaces;
    sessionProperties?: ProposalTypes.SessionProperties;
    peer: {
        publicKey: string;
        metadata: {
            name: string;
            description: string;
            url: string;
            icons: string[];
            verifyUrl?: string;
        };
    };
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
