export const ERC721_INTERFACE_ID = '0x80ac58cd';
export const ERC1155_INTERFACE_ID = '0xd9b67a26';

export const ERC165_ABI = [
    {
        name: 'supportsInterface',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'interfaceId', type: 'bytes4' }],
        outputs: [{ type: 'bool' }],
    },
] as const;
