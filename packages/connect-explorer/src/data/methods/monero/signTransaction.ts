const name = 'moneroSignTransaction';
const docs = 'methods/moneroSignTransaction.md';

// Fields for MoneroOutputEntry (ring member)
const outputEntryFields = [
    {
        name: 'idx',
        label: 'Output Index',
        type: 'number',
        value: 0,
    },
    {
        name: 'key.dest',
        label: 'Destination Key (hex)',
        type: 'input',
        value: '0a09ab658fca97610a38b8a5c206a0709db435341c31a9d40150df7e52440ac6',
    },
    {
        name: 'key.commitment',
        label: 'Commitment (hex)',
        type: 'input',
        value: 'c657ada42fec6d88c946a186ef6e1ddd75dc40f86e5141e1d5706a079ba05051',
    },
];

// Fields for MoneroTransactionSourceEntry (input/UTXO)
const sourceEntryFields = [
    {
        name: 'amount',
        label: 'Amount (atomic units)',
        type: 'number',
        value: 100_000000000000,
    },
    {
        name: 'real_output',
        label: 'Real Output index',
        type: 'number',
        value: 15,
    },
    {
        name: 'real_output_in_tx_index',
        label: 'Real Output in Transaction Index',
        type: 'number',
        value: 1,
    },
    {
        name: 'real_out_tx_key',
        label: 'Real Output Transaction Key (hex)',
        type: 'input',
        value: 'da13cd8f4cc2c4f769d88b734d71cfdc0e43d01a20eb7bff6553fd67cb2ed37e',
    },
    {
        name: 'real_out_additional_tx_keys',
        label: 'Real Output Additional Transaction Keys (hex, json array)',
        type: 'json',
        value: [],
    },
    {
        name: 'rct',
        label: 'RingCT (hex)',
        type: 'boolean',
        value: true,
    },
    {
        name: 'mask',
        label: 'Mask (hex)',
        type: 'input',
        value: 'a3b76c2333567dba7d0f5fbc34a9691ef0d161dd808ada7e530dabb608f61e03',
    },
    {
        name: 'subaddr_minor',
        label: 'Subaddress Minor Indices (json array)',
        type: 'number',
        value: 0,
    },
    {
        name: 'outputs',
        label: 'Outputs (Ring Members)',
        type: 'array',
        batch: [
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
            {
                type: 'output-entry',
                fields: outputEntryFields,
            },
        ],
        items: [
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: 'c5332682d70b06773ff820a00f5c06475b7c446ff916afd24fe1a66e54852f60',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: 'ec8b8efa3767e87a9fd33522222e37f861ae06ca0322fa6f2edf03360149244d',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 954,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '17dee035a7b1fc56e766b762103eeb353df1d07be8210cfcadaf2cf92c1c8e44',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '6173c857698cbfc62ab4f3d527b0af1994456c8183866a53b8c75d37644d2361',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 64,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '173c0c9886a9b49bd925b550c59529ee9b50da8e820401203cd140817839d463',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '1f374c45433341bb10bb12dc61dfd31925c6c66993d51e76a0ea472821749037',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 92,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '985d174a4749c72b264f197ddca953be029ea1045d1653a2e6a09c95b1bc0c75',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '60a88cd2de1444c3f53f12a0060822e62262b1d749a38afa510e32788c40df48',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 168,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '626fa16ef8b7962038c05911b9d8124cade460f3b4ab6a59a8286129eef0e21b',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: 'e2a23951e32d4f5f648c85a3bde9d2330c7bc0cd895f0b711a960942c67fa900',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 17,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '41659ce06775fac7a1bc600145c117341cb10b76e111be6348bc939d80ac6b9f',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '94bfab76ba2957d12b995b5e7a76c4b30c040e5912d93d4469a1a7781cfffd53',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 113,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: 'd32e6086f8f54c27b7b04c124b7a4a4d8885743afdeb72c424fa1167b8b5a938',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: 'b020da7bb02f0265880a24a5a9d29aab1029c1994b10521f76b7f1702f3ed18e',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 118,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '0d795299aedb6d239a16a6615cb4dea465cdf71396916c8262de5a246ac9436f',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '717bf380df568a7dc7b0323b89a1f6c7775c7cacf0d572cff87d64f6971ef6ef',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 209,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '17c3c1792154ec15ae1c4a57c04e5c2dafd243348d29e5ac24167e7e79e33bac',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '911b195eb755688499094ab458292068840fd3b7ae2c201caf94f297d7632196',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 91,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '690ee9a28cdd30c749e08532bb1911ebe97bcb0b7a1263bbe411042d7fdf2e71',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '5209d599eb1d86aea5edc1e2edbd86d02b856587c2f1a717c2435780a0995551',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 66,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '8cb4456b9696f4024c519d563d032a70772a2096604e960550f7ac170facd13c',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '512fe07be18179e4a971cfa9c5885b2314b70921af224c1533f84c2c112ca9bf',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 67,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '42b400122f005fb457c6dffb97c6cee7f251f63c374711bf1e794bb84ec6d051',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: 'd5e7f42bd1fc08c647613c8222dd67bd573efbafad08952c43d942ff124bde19',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 23,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '305fba672172530eb6f67e9957f4fd75d909d70f131a8afd3566a637e8c407ba',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '7d8b093e96f71896908fe89ee64956216237cf5e2119c24a841108d15e867e9d',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 48,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: 'c007fd69792b84c94263a3afc3dce5f1163b7aca88ae45996eb456ececed0dc6',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: 'b4e99ec010ab13471037aa531e65ec89571baf4c22d1211228ac9d537456440b',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 60,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '9ef9c0cba7f10c6d044d6a00af49b787f89e21913775f22bb6df728d46fdc88b',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: '682bcea0aec29c649ea3b452d969ba4a3cd2b403d4690f0901d49375bcbb4b52',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 12,
                },
            ],
            [
                {
                    name: 'key.dest',
                    label: 'Destination Key (hex)',
                    type: 'input',
                    value: '0a09ab658fca97610a38b8a5c206a0709db435341c31a9d40150df7e52440ac6',
                },
                {
                    name: 'key.commitment',
                    label: 'Commitment (hex)',
                    type: 'input',
                    value: 'c657ada42fec6d88c946a186ef6e1ddd75dc40f86e5141e1d5706a079ba05051',
                },
                {
                    name: 'idx',
                    label: 'Output Index',
                    type: 'number',
                    value: 87,
                },
            ],
        ],
    },
];

// Fields for MoneroTransactionDestinationEntry (output)
const destinationEntryFields = [
    {
        name: 'amount',
        label: 'Amount (atomic units)',
        type: 'number',
        value: 20_000000000000,
    },
    {
        name: 'addr.spend_public_key',
        label: 'Spend Public Key (hex)',
        type: 'input',
        value: '28f2360129c620e7eb306505e18a045d445372646d2c51fa7eed69dab2f9ffcf',
    },
    {
        name: 'addr.view_public_key',
        label: 'View Public Key (hex)',
        type: 'input',
        value: '31bff4082dad67759bd220a5f2caa9a1c1716075eefa5d547ea72230e191561f',
    },
    {
        name: 'original',
        label: 'Original Address',
        type: 'input',
        value: '9tieaD2MktPfnuKEkJCxsDGbojXPjxkSciu89FX1odVgbf3b1o4CVftLfxBkKJ4YyNU4EUSXGUrfvF8hswfz15ky4aP9jT1',
    },
    {
        name: 'is_subaddress',
        label: 'Is Subaddress',
        type: 'checkbox',
        value: false,
    },
    {
        name: 'is_integrated',
        label: 'Is Integrated',
        type: 'checkbox',
        value: false,
    },
];

const changeDestinationEntryFields = [
    {
        name: 'amount',
        label: 'Amount (atomic units)',
        type: 'number',
        value: 79_999000000000,
    },
    {
        name: 'addr.spend_public_key',
        label: 'Spend Public Key (hex)',
        type: 'input',
        value: '9f1b39ee15005b7af11db2cdd8f802de2b7e8667b52e5944aa96355d880d9c51',
    },
    {
        name: 'addr.view_public_key',
        label: 'View Public Key (hex)',
        type: 'input',
        value: '93e6b2de17d6adfc03a97dd5c9007f0daa39fdea7b2b67a7cba37d3a0371ddb9',
    },
    {
        name: 'original',
        label: 'Original Address',
        type: 'input',
        value: '9yCMhXSreAeMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMvrvRRU',
    },
    {
        name: 'is_subaddress',
        label: 'Is Subaddress',
        type: 'checkbox',
        value: false,
    },
    {
        name: 'is_integrated',
        label: 'Is Integrated',
        type: 'checkbox',
        value: false,
    },
];

const fields = [
    {
        name: 'path',
        label: 'BIP44 Path',
        type: 'input',
        value: `m/44'/128'/0'`,
    },
    {
        name: 'networkType',
        label: 'Network Type',
        type: 'select',
        value: 0,
        data: [
            { value: 0, label: 'MAINNET' },
            { value: 1, label: 'TESTNET' },
            { value: 2, label: 'STAGENET' },
            { value: 3, label: 'FAKECHAIN' },
        ],
    },
    {
        name: 'tsx_data.account',
        label: 'Account Index',
        type: 'number',
        value: 0,
    },
    {
        name: 'tsx_data.num_inputs',
        label: 'Number of Inputs',
        type: 'number',
        value: 1,
    },
    {
        name: 'tsx_data.unlock_time',
        label: 'Unlock Time',
        type: 'number',
        value: 0,
    },
    {
        name: 'tsx_data.mixin',
        label: 'Mixin',
        type: 'number',
        value: 15,
    },
    {
        name: 'tsx_data.hard_fork',
        label: 'Hard Fork Version',
        type: 'number',
        value: 16,
    },
    {
        name: 'tsx_data.minor_indices',
        label: 'Minor Indices',
        type: 'json',
        value: [],
    },
    {
        name: 'tsx_data.integrated_indices',
        label: 'Integrated Indices',
        type: 'json',
        value: [],
    },
    {
        name: 'tsx_data.fee',
        label: 'Transaction Fee (atomic units)',
        type: 'number',
        value: 1000000000,
    },
    {
        name: 'tsx_data.payment_id',
        label: 'Payment ID (hex)',
        type: 'input',
        value: '',
    },
    {
        name: 'tsx_data.chunkify',
        label: 'Chunkify',
        type: 'boolean',
        value: false,
    },
    {
        name: 'tsx_data.rsig_data.rsig_type',
        label: 'Ring Signature Type',
        type: 'number',
        value: 1,
    },
    {
        name: 'tsx_data.rsig_data.bp_version',
        label: 'Bulletproof Version',
        type: 'number',
        value: 4,
    },
    {
        name: 'tsx_data.rsig_data.grouping',
        label: 'Grouping',
        type: 'json',
        value: [2],
    },
    {
        name: 'tsx_data.outputs',
        label: 'Outputs (Destinations)',
        type: 'array',
        batch: [
            {
                type: 'destination-entry',
                fields: destinationEntryFields,
            },
        ],
        items: [changeDestinationEntryFields, destinationEntryFields],
    },
    {
        name: 'inputs',
        label: 'Inputs (UTXOs)',
        type: 'array',
        batch: [
            {
                type: 'source-entry',
                fields: sourceEntryFields,
            },
        ],
        items: [sourceEntryFields],
    },
];

export default [
    {
        url: '/method/moneroSignTransaction',
        name,
        docs,
        submitButton: 'Sign Transaction',
        fields,
    },
];
