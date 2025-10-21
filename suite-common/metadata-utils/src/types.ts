export interface Slip15LikeInput {
    version: string;
    accountLabel?: string;
    outputLabels?: {
        [txid: string]: {
            [vout: string]: string; // output index as a string
        };
    };
    addressLabels?: {
        [address: string]: string;
    };
}

export interface Bip329Label {
    type: 'tx' | 'addr' | 'wallet' | 'xpub' | 'pubkey' | 'input' | 'output';
    ref?: string; // The identifier for the object being labeled (e.g., txid, address, txid:vout)
    label: string; // The label text
    spendable?: boolean;
}
