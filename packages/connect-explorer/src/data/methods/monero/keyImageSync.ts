const name = 'moneroKeyImageSync';

type TransferDetail = {
    out_key: string;
    tx_pub_key: string;
    internal_output_index: number;
    sub_addr_minor: number;
};

const accountTransferDetail: TransferDetail = {
    out_key: '7dec0733b4075ec403f0671f1e15e4f3d5c1be34b371bacf9db69355d0bf2ded',
    tx_pub_key: 'e3c8b1f31e695a57ed073bf7cb09d85c82870766887673974ea154dfbb55e565',
    internal_output_index: 1,
    sub_addr_minor: 0,
};

const subaddressTransferDetail: TransferDetail = {
    out_key: 'bb20e1f5bb0eaa2d3d41e14abc332045eac8668a90f3bade80aac351fc0ac957',
    tx_pub_key: '20d05f96031bcb263d0a9a751184fe9b3fa2f8814138611ef68dd3f6f0fb1bcf',
    internal_output_index: 1,
    sub_addr_minor: 1,
};

const getTdiFields = (transferDetail: TransferDetail) => [
    {
        name: 'out_key',
        type: 'input',
        value: transferDetail.out_key,
    },
    {
        name: 'tx_pub_key',
        type: 'input',
        value: transferDetail.tx_pub_key,
    },
    {
        name: 'additional_tx_pub_keys',
        type: 'input',
        value: '',
        optional: true,
    },
    {
        name: 'internal_output_index',
        type: 'number',
        value: transferDetail.internal_output_index,
    },
    {
        name: 'sub_addr_major',
        type: 'number',
        value: 0,
        optional: true,
    },
    {
        name: 'sub_addr_minor',
        type: 'number',
        value: transferDetail.sub_addr_minor,
        optional: true,
    },
];

const fields = [
    {
        name: 'path',
        type: 'input',
        value: `m/44'/128'/0'`,
    },
    {
        name: 'networkType',
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
        name: 'tdis',
        type: 'array',
        batch: [
            {
                type: 'transfer-details',
                fields: getTdiFields(accountTransferDetail),
            },
        ],
        items: [getTdiFields(accountTransferDetail), getTdiFields(subaddressTransferDetail)],
    },
];

export default [
    {
        name,
        submitButton: 'Sync key images',
        fields,
    },
];
