import { verifyEntropy } from '../verifyEntropy';

describe('firmware/verifyEntropy', () => {
    it('bip39 success', async () => {
        const response = await verifyEntropy({
            strength: 256,
            hostEntropy: 'e14806194511f95f2e6b7c5267fcb824469a478007d97339da08abb379244553',
            commitment: '09c7dff5c85814852fb9cb12feecd11183f7af1c10296a5075f276c5eca9fb44',
            trezorEntropy: 'ffa4581852ee93e789b9e83554f58dd1a3e09765a64d91d8cd08f6b5c813745d',
            xpubs: {
                "m/84'/0'/0'":
                    'xpub6CCMQserNP7QkjspvUVWfCdjK1FcgFdmka3ZgzVgZKqkkCL5bfQoscxZ9UzTLLLedPGwkhQobEGE84gWvZY1tXaHJsVLMHA6cXNUmXnrj3s',
                "m/44'/60'/0'":
                    'xpub6Cdh8AtW8tSXTDYYGirGkmTCgYe4SCCAuqJLmqkhDFYVCkHLngQ7JmNSVuCQuQARqx5tDJJ9my1JCgaUHHizioZZoXRWw6LR95uQUkbKJi3',
            },
        });
        expect(response.success).toEqual(true);
    });

    it('slip39 success', async () => {
        const response = await verifyEntropy({
            type: 1,
            strength: 256,
            hostEntropy: '20e1524b5ea128b581c8882ddd5b030dd54e3bf49c8e7063768be13e0add4420',
            commitment: '0ea37a3ae4e765ac59f6d721548920c92667bb9cc09b53ebf81404d3c07794a1',
            trezorEntropy: '00610ab95fe09b3d32320662e96ba195344461b00322a09b86df68432db1e745',
            xpubs: {
                "m/84'/0'/0'":
                    'xpub6CxDGHMZekeQtFmny74NHcf1cA8opN8yWHLdmXhwhin7WrjCWKgypDyG5SoCR7ae57JqPT8ZWd2st56yzgC8bzzpHRDurXxZxkaZfXeF1bW',
                "m/44'/60'/0'":
                    'xpub6CV17nmnkijMua6ZpyRU7MNnZjHoByRGoWf2nPxJmKF1EriH92awnhV7KS2X1mB6ke1fuRerGir3kvZr6uRcQqn2Pnv48gmhtsyaHcLALVG',
            },
        });
        expect(response.success).toEqual(true);
    });
});
