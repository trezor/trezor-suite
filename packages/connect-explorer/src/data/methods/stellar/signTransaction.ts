const name = 'stellarSignTransaction';

const example = `{
    "source": "GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV",
    "fee": 100,
    "sequence": 4294967296,
    "timebounds": {
        "minTime": 0,
        "maxTime": 0
    },
    "memo": {
        "type": 0
    },
    "operations": [
        {
            "type": "payment",
            "source": "GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV",
            "destination": "GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV",
            "asset": { "code": "XLM", "type": 0 },
            "amount": "10000"
        }
    ]
}`;

export default [
    {
        name,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/44'/148'/0'`,
            },
            {
                name: 'networkPassphrase',
                type: 'input-long',
                value: 'Test SDF Network ; September 2015',
            },
            {
                name: 'transaction',
                type: 'json',
                value: example,
            },
        ],
    },
];
