import { WalletKitTypes } from '@reown/walletkit';
import type { ProposalTypes } from '@walletconnect/types';

import { SuiteCompatibleThunk } from '@suite-common/redux-utils';
import { Network } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

export interface WalletConnectAdapter {
    networkType: string;
    methods: string[];
    requestThunk: SuiteCompatibleThunk<{
        event: WalletKitTypes.SessionRequest;
    }>;
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
