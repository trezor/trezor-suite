// https://kmdexplorer.io/tx/97ee68779fe36ed9d31cdd28a1a1343ba3bbeccb25352ce851a30c2c7a99090c

export default {
    valid: [
        {
            description: 'Komodo 1 in 1 out',
            network: 'komodo',
            id: '97ee68779fe36ed9d31cdd28a1a1343ba3bbeccb25352ce851a30c2c7a99090c',
            hash: '0c09997a2c0ca351e82c3525cbecbba33b34a1a128dd1cd3d96ee39f7768ee97',
            hex: '0400008085202f890138a4f1c20af1857ae501c4a3bbca7a66f8a375ab67f46b8f20acf700137c9b52000000004847304402203cc89c6afa5a8f17ed149599ba72c0b456f413791f9fb49c287a28ce4915798102202a0f54e418d373ea3d6b0a5bb88bc329e4f7c4dec20f56496bd2b1dde8fac35301ffffffff01d781e511000000001976a9140ba28b3eebfe1d39dab038324be2c66090ee21a388ac8141df5e000000000000000000000000000000',
            coinbase: false,
            virtualSize: 176,
            weight: 704,
            raw: {
                version: 4,
                locktime: 1591689601,
                ins: [
                    {
                        hash: '38a4f1c20af1857ae501c4a3bbca7a66f8a375ab67f46b8f20acf700137c9b52',
                        index: 0,
                        script: '304402203cc89c6afa5a8f17ed149599ba72c0b456f413791f9fb49c287a28ce4915798102202a0f54e418d373ea3d6b0a5bb88bc329e4f7c4dec20f56496bd2b1dde8fac35301',
                        sequence: 4294967295,
                    },
                ],
                outs: [
                    {
                        value: '300253655',
                        script: 'OP_DUP OP_HASH160 0ba28b3eebfe1d39dab038324be2c66090ee21a3 OP_EQUALVERIFY OP_CHECKSIG',
                    },
                ],
            },
        },
    ],
};
