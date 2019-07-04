import { Network } from './networkTypes';
import { Icon } from './iconTypes';
import { NetworkToken, Token } from './tokenTypes';

export { Network, Icon, NetworkToken, Token };

// TODO import from connect
interface BlockchainLinkToken {
    name: string;
    shortcut: string;
    value: string;
}

export interface BlockchainLinkTransaction {
    type: 'send' | 'recv';
    timestamp?: number;
    blockHeight?: number;
    blockHash?: string;
    descriptor: string;
    inputs: any;
    outputs: any;

    hash: string;
    amount: string;
    fee: string;
    total: string;

    tokens?: BlockchainLinkToken[];
    sequence?: number; // eth: nonce || ripple: sequence
}
// TODO END

export interface Transaction extends BlockchainLinkTransaction {
    deviceState: string;
    network: string;
    rejected?: boolean;
}
