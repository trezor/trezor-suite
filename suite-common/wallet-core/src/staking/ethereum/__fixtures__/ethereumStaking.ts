import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

export const transformTxFixtures = [
    {
        description:
            'should transform transaction data, omit "from", and convert units correctly 1',
        tx: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            from: '0xCe66A9577F4e2589c1D1547B75B7A2b0807cE0ed',
            gasLimit: 416102,
            to: EVERSTAKE_CONTRACTS[560048].pool,
            value: '122222000000000000',
        },
        gasPrice: '50',
        nonce: '26',
        chainId: 1,
        result: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            gasLimit: '0x65966',
            gasPrice: '0xba43b7400',
            nonce: '0x1a',
            chainId: 1,
            to: EVERSTAKE_CONTRACTS[560048].pool,
            value: '0x1b23842edbce000',
        },
    },
    {
        description:
            'should transform transaction data, omit "from", and convert units correctly 2',
        tx: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            from: '0xCe66A9577F4e2589c1D1547B75B7A2b0807cE0ed',
            gasLimit: 300000,
            to: EVERSTAKE_CONTRACTS[560048].pool,
            value: '10000',
        },
        gasPrice: '1',
        nonce: '1',
        chainId: 1,
        result: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            gasLimit: '0x493e0',
            gasPrice: '0x3b9aca00',
            nonce: '0x1',
            chainId: 1,
            to: EVERSTAKE_CONTRACTS[560048].pool,
            value: '0x2710',
        },
    },
];

export const getStakeFormsDefaultValuesFixture = [
    {
        description: 'should carry the staking provider of the form',
        args: {
            address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            stakeType: 'unstake',
            amount: '0.5',
            providerId: 'everstake',
        },
        result: {
            fiatInput: '',
            cryptoInput: '0.5',
            outputs: [
                {
                    address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
                    amount: '0.5',
                    type: 'payment',
                    fiat: '',
                    currency: { value: 'usd', label: 'USD' },
                    token: null,
                    label: '',
                },
            ],
            options: ['broadcast'],
            stakeType: 'unstake',
            providerId: 'everstake',
            ethereumNonce: '',
            transactionData: '',
            estimatedFeeLimit: undefined,
            feeLimit: '',
            feePerUnit: '',
            selectedFee: undefined,
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            selectedUtxos: [],
        },
    },
    {
        description: 'should return default values for stake forms',
        args: {
            address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            stakeType: 'stake',
            amount: '0.1',
        },
        result: {
            fiatInput: '',
            cryptoInput: '0.1',
            outputs: [
                {
                    address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
                    amount: '0.1',
                    type: 'payment',
                    fiat: '',
                    currency: { value: 'usd', label: 'USD' },
                    token: null,
                    label: '',
                },
            ],
            options: ['broadcast'],
            stakeType: 'stake',
            ethereumNonce: '',
            transactionData: '',
            estimatedFeeLimit: undefined,
            feeLimit: '',
            feePerUnit: '',
            selectedFee: undefined,
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            selectedUtxos: [],
        },
    },
    {
        description:
            'should return default values for stake forms with empty amount when amount is invalid',
        args: {
            address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            stakeType: 'stake',
            amount: undefined,
        },
        result: {
            fiatInput: '',
            cryptoInput: '', // empty amount
            outputs: [
                {
                    address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
                    amount: '', // empty amount
                    type: 'payment',
                    fiat: '',
                    currency: { value: 'usd', label: 'USD' },
                    token: null,
                    label: '',
                },
            ],
            options: ['broadcast'],
            stakeType: 'stake',
            ethereumNonce: '',
            transactionData: '',
            estimatedFeeLimit: undefined,
            feeLimit: '',
            feePerUnit: '',
            selectedFee: undefined,
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            selectedUtxos: [],
        },
    },
];
