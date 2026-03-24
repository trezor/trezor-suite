export type Bip329Label = {
    type: 'tx' | 'addr' | 'wallet' | 'xpub' | 'pubkey' | 'input' | 'output';
    ref?: string; // The identifier for the object being labeled (e.g., txid, address, txid:vout)
    label: string; // The label text
    spendable?: boolean;
};
