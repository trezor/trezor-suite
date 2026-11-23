export type SendFormTokenPrefill = {
    type: 'token';
    contractAddress: string;
};

export type SendFormNFTPrefill = {
    type: 'nft';
    contractAddress: string;
    tokenId: string;
};

export type SendFormPrefill = SendFormTokenPrefill | SendFormNFTPrefill;
