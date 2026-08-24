const name = 'ethereumSignTransaction';

const tx = {
    nonce: '0x0',
    maxFeePerGas: '0x7ea8163',
    maxPriorityFeePerGas: '0x186a0',
    gasLimit: '0x10fc5',
    to: '0x14495e5ef84823170b62176913d798b26a1a1a69',
    chainId: 1,
    value: '0x0',
    // MetaMask delegate, one of the contracts allowed by firmware. Use the zero address to revoke
    // an existing delegation instead.
    authorizationList: [{ address: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b' }],
};

export default [
    {
        name,
        submitButton: 'Sign EIP-7702 transaction',
        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/44'/60'/0'/0/0`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: tx,
            },
            {
                name: '__experimental',
                type: 'checkbox',
                value: true,
            },
        ],
    },
];
