export default {
    method: 'verifyMessage',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'uncompressed pubkey - ok',
            params: {
                coin: 'Bitcoin',
                address: '1JwSSubhmg6iPtRjtyqhUYYH7bZg3Lfy1T',
                signature: Buffer.from(
                    '1ba77e01a9e17ba158b962cfef5f13dfed676ffc2b4bada24e58f784458b52b97421470d001d53d5880cf5e10e76f02be3e80bf21e18398cbd41e8c3b4af74c8c2',
                    'hex',
                ).toString('base64'),
                message: Buffer.from('This is an example of a signed message.', 'utf-8').toString(
                    'hex',
                ),
                hex: true,
            },
            result: {
                message: 'Message verified',
            },
        },
        {
            description: 'compressed pubkey - wrong sig',
            params: {
                coin: 'Bitcoin',
                address: '1JwSSubhmg6iPtRjtyqhUYYH7bZg3Lfy1T',
                signature: Buffer.from(
                    '1ba77e01a9e17ba158b962cfef5f13dfed676ffc2b4bada24e58f784458b52b97421470d001d53d5880cf5e10e76f02be3e80bf21e18398cbd41e8c3b4af74c800',
                    'hex',
                ).toString('base64'),
                message: 'This is an example of a signed message.',
            },
            result: false,
        },
        {
            description: 'compressed pubkey - wrong msg',
            params: {
                coin: 'Bitcoin',
                address: '1JwSSubhmg6iPtRjtyqhUYYH7bZg3Lfy1T',
                signature: Buffer.from(
                    '1ba77e01a9e17ba158b962cfef5f13dfed676ffc2b4bada24e58f784458b52b97421470d001d53d5880cf5e10e76f02be3e80bf21e18398cbd41e8c3b4af74c8c2',
                    'hex',
                ).toString('base64'),
                message: 'This is an example of a signed message!',
            },
            result: false,
        },
        {
            description: 'compressed pubkey - ok',
            params: {
                coin: 'Bitcoin',
                address: '1C7zdTfnkzmr13HfA2vNm5SJYRK6nEKyq8',
                signature: Buffer.from(
                    '1f44e3e461f7ca9f57c472ce1a28214df1de1dadefb6551a32d1907b80c74d5a1fbfd6daaba12dd8cb06699ce3f6941fbe0f3957b5802d13076181046e741eaaaf',
                    'hex',
                ).toString('base64'),
                message: 'This is an example of a signed message.',
            },
            result: {
                message: 'Message verified',
            },
        },
        {
            description: 'trezor pubkey - wrong sig',
            params: {
                coin: 'Bitcoin',
                address: '1C7zdTfnkzmr13HfA2vNm5SJYRK6nEKyq8',
                signature: Buffer.from(
                    '1f44e3e461f7ca9f57c472ce1a28214df1de1dadefb6551a32d1907b80c74d5a1fbfd6daaba12dd8cb06699ce3f6941fbe0f3957b5802d13076181046e741eaa00',
                    'hex',
                ).toString('base64'),
                message: 'This is an example of a signed message.',
            },
            result: false,
        },
        {
            description: 'trezor pubkey - ok',
            params: {
                coin: 'Bitcoin',
                address: '14LmW5k4ssUrtbAB4255zdqv3b4w1TuX9e',
                signature: Buffer.from(
                    '209e23edf0e4e47ff1dec27f32cd78c50e74ef018ee8a6adf35ae17c7a9b0dd96f48b493fd7dbab03efb6f439c6383c9523b3bbc5f1a7d158a6af90ab154e9be80',
                    'hex',
                ).toString('base64'),
                message: Buffer.from('This is an example of a signed message.', 'utf-8').toString(
                    'hex',
                ),
                hex: true,
            },
            result: {
                message: 'Message verified',
            },
        },
        {
            description: 'trezor pubkey - wrong msg',
            params: {
                coin: 'Bitcoin',
                address: '14LmW5k4ssUrtbAB4255zdqv3b4w1TuX9e',
                signature: Buffer.from(
                    '209e23edf0e4e47ff1dec27f32cd78c50e74ef018ee8a6adf35ae17c7a9b0dd96f48b493fd7dbab03efb6f439c6383c9523b3bbc5f1a7d158a6af90ab154e9be80',
                    'hex',
                ).toString('base64'),
                message: 'This is an example of a signed message!',
            },
            result: false,
        },
        {
            description: 'verify long',
            params: {
                coin: 'Bitcoin',
                address: '14LmW5k4ssUrtbAB4255zdqv3b4w1TuX9e',
                signature: Buffer.from(
                    '205ff795c29aef7538f8b3bdb2e8add0d0722ad630a140b6aefd504a5a895cbd867cbb00981afc50edd0398211e8d7c304bb8efa461181bc0afa67ea4a720a89ed',
                    'hex',
                ).toString('base64'),
                message: 'VeryLongMessage!'.repeat(64),
            },
            result: {
                message: 'Message verified',
            },
        },
        {
            description: 'verify bcash',
            params: {
                coin: 'Bitcoin',
                address: '1KzXE97kV7DrpxCViCN3HbGbiKhzzPM7TQ',
                signature: Buffer.from(
                    '1cc694f0f23901dfe3603789142f36a3fc582d0d5c0ec7215cf2ccd641e4e37228504f3d4dc3eea28bbdbf5da27c49d4635c097004d9f228750ccd836a8e1460c0',
                    'hex',
                ).toString('base64'),
                message: 'žluťoučký kůň úpěl ďábelské ódy',
            },
            result: {
                message: 'Message verified',
            },
        },
    ],
};
