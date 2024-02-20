import { select } from './common';

const name = 'signTransaction';
const docs = 'methods/signTransaction.md';

const test = {
    inputs: `[
        {
           "address_n":[
              2147483693,
              0,
              0,
              0
           ],
           "prev_hash":"b42c658796927fb4d75aa7c5c404be78718c814b4fcd9a22a077a8c876a7240f",
           "prev_index":0,
           "script_sig":"00483045022100f96ce611c1e06e540acadc83d8b74c4e8e38aaedea6c1bae5f6e25ce07d83a2f02201960ad9b78c9f511d75444794a9b975391913f6526cd095de1d7f4edd7ee050c0101ff4cad524c53ff043587cf0000000000000000006109a29836a5adfc1e03c0ec9f9e606109d9392670d8bcabdacdfa7ce9e48ed5028cb7707b6a0b73a27946c044f3d2ea9356e9b163986c07c22e299e93e16d45aa000000004c53ff043587cf02b114b63000000000d499aa3ddd978271b43979d84a38656b296177c08e1babfb4fdc15f59c4bfec4023b7830d36f197844b7203a9fab93afde0d2eb45aa98352e394c750280ec97e950000000052ae",
           "sequence":4294967293,
           "script_type":"SPENDMULTISIG",
           "multisig":{
              "m":2,
              "pubkeys":[
                 {
                    "node":"tpubD6NzVbkrYhZ4XJeyzHmeBT7k3caJqz8JJgnFUCPmDv287qWcVm4Sq7av35EpbF5hjHMqwRykp3PYhjnrvqwfmvEzoafLJkjZdw8sP8kRCr3",
                    "address_n":[
                       0,
                       0
                    ]
                 },
                 {
                    "node":"tpubDBSkiQYQ3thN8VgYvtYHBUJR7KUJZvDNzdJXJ45thgnnakd8hUALaBCkxSqoxyL4jxSbdiS2iobo2QzPYGmsJ6VJpcawSXM9XrrgDyzWTpr",
                    "address_n":[
                       0,
                       0
                    ]
                 }
              ],
              "signatures":[
                 "",
                 ""
              ]
           },
           "amount":"11099696"
        }
     ]`,
    outputs: `[
        {
           "address":"n1iozfb1SY9tDj5vwaLtKJWZ6EgZrYpZej",
           "amount":"11089696",
           "script_type":"PAYTOADDRESS"
        }
     ]`,
};

const examples = {
    test,
};

export default [
    {
        url: '/method/signTransaction-multisig',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'test',
                affect: ['inputs', 'outputs'],
                data: select.map(v => {
                    const example = examples[v.value];

                    return {
                        ...v,
                        affectedValue: example ? [example.inputs, example.outputs] : undefined,
                    };
                }),
            },
            {
                name: 'inputs',
                type: 'json',
                value: '',
            },
            {
                name: 'outputs',
                type: 'json',
                value: '',
            },
            {
                name: 'push',
                label: 'Push transaction',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'chunkify',
                label: 'Display recipient address in chunks of 4 characters',
                type: 'checkbox',
                value: false,
            },
        ],
    },
];
