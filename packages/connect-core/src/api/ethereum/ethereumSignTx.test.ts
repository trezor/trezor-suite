import { keccak256, recoverTransactionAddress } from 'viem';

import * as fixtures from './__fixtures__/ethereumSignTx';
import { parseAuth7702List, serializeEthereumTx } from './ethereumSignTx';

describe('helpers/ethereumSignTx', () => {
    describe('serializeEthereumTx', () => {
        fixtures.serializeEthereumTx.forEach(f => {
            it(f.description, async () => {
                const isLegacy = f.type === undefined || f.type === 0;
                const serialized = serializeEthereumTx(f.tx, f.signature, isLegacy);

                // Verify signature hash
                const hash = keccak256(serialized);
                expect(hash).toEqual(f.result);

                // Verify by parsing sender address from serialized transaction
                const senderAddress = await recoverTransactionAddress({
                    serializedTransaction: serialized,
                });

                // Compare sender address (based on signature)
                expect(senderAddress.toLowerCase()).toEqual(f.from);
            });
        });

        // Ground-truth vector from trezor-firmware (common/tests/fixtures/ethereum/
        // sign_tx_eip7702_mainnet.json, "metamask_authorize"), validated with Foundry.
        it('EIP-7702 set-code (type 4) tx with an authorization list', () => {
            const tx = {
                chainId: 1,
                to: '0x14495E5EF84823170B62176913d798B26a1a1A69',
                value: '0x0',
                nonce: '0x0',
                gasLimit: '0x10fc5',
                maxFeePerGas: '0x7ea8163',
                maxPriorityFeePerGas: '0x186a0',
            } as const;
            // Transaction signature returned by the device.
            const signature = {
                v: '0x0',
                r: '0x0ebf86aed4ee9b2a9fc8c1e39d91ebcb19a8cf54449a5f823d63c3cfc428ffad',
                s: '0x28c2eb4d75d2d78844a8521bbbffc26fdcab7e670ad768b28031532b9e488022',
            } as const;
            // Signed authorization tuple returned by the device (nonce is tx nonce + 1).
            const authorizationList = [
                {
                    chainId: 1,
                    address: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b',
                    nonce: 1,
                    yParity: 1,
                    r: '0xd426d296c73c62e5d5528e1cea701dd55060cc34264f33412ef2ea7c5007d380',
                    s: '0x7f83c40c1080483ecb8ba26a91f1408a2d3186f2577c4f563c2b95b467f78ed7',
                },
            ] as const;

            const serialized = serializeEthereumTx(tx, signature, false, [...authorizationList]);

            expect(serialized).toEqual(
                '0x04f8c80180830186a08407ea816383010fc59414495e5ef84823170b62176913d798b26a1a1a698080c0f85cf85a019463c0c19a282a1b52b07dd5a65b58948a07dae32b0101a0d426d296c73c62e5d5528e1cea701dd55060cc34264f33412ef2ea7c5007d380a07f83c40c1080483ecb8ba26a91f1408a2d3186f2577c4f563c2b95b467f78ed780a00ebf86aed4ee9b2a9fc8c1e39d91ebcb19a8cf54449a5f823d63c3cfc428ffada028c2eb4d75d2d78844a8521bbbffc26fdcab7e670ad768b28031532b9e488022',
            );
        });
    });

    describe('parseAuth7702List', () => {
        const delegate = '63c0c19a282a1b52b07dd5a65b58948a07dae32b';
        const r = 'd426d296c73c62e5d5528e1cea701dd55060cc34264f33412ef2ea7c5007d380';
        const s = '7f83c40c1080483ecb8ba26a91f1408a2d3186f2577c4f563c2b95b467f78ed7';
        // tuple: [chain_id, delegate, nonce, y_parity, r, s], integers as minimal big-endian hex
        const tuple = (nonceHex: string) => [{ items: ['01', delegate, nonceHex, '01', r, s] }];

        it('parses a tuple losslessly', () => {
            expect(parseAuth7702List(tuple('01'))).toEqual([
                {
                    chainId: 1,
                    address: `0x${delegate}`,
                    nonce: 1,
                    yParity: 1,
                    r: `0x${r}`,
                    s: `0x${s}`,
                },
            ]);
        });

        it('accepts a nonce at the safe integer boundary', () => {
            // 0x1fffffffffffff === Number.MAX_SAFE_INTEGER
            expect(parseAuth7702List(tuple('1fffffffffffff'))?.[0]?.nonce).toBe(
                Number.MAX_SAFE_INTEGER,
            );
        });

        it('rejects a nonce above the safe integer range instead of rounding', () => {
            // 0x20000000000000 === Number.MAX_SAFE_INTEGER + 1
            expect(() => parseAuth7702List(tuple('20000000000000'))).toThrow(
                'exceeds the safe integer range',
            );
        });
    });
});
