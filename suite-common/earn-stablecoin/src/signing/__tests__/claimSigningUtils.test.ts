import {
    buildClaimCalldata,
    buildClaimTransactionReview,
    buildUnsignedClaimTransaction,
} from '../claimSigningUtils';
import type { ClaimReward } from '../claimSigningUtils';

const SENDER = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';
const CLAIM_CONTRACT = '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae';
const TOKEN = '0x58D97B57BB95320F9a05dC918Aef65434969c2B2';
const PROOF = ['0xd8f0361b28675e4ac82f066f7abdaaffaa6e0fbd418f60dca41ae70656edd18b'];

const createReward = (tokenAddress = TOKEN): ClaimReward => ({
    amount: '848795999565318',
    proofs: PROOF,
    token: {
        address: tokenAddress,
        symbol: 'USDC',
    },
});

const CLAIM_CALLDATA = buildClaimCalldata({
    senderAddress: SENDER,
    rewards: [createReward()],
});

const unsignedTransaction = {
    to: CLAIM_CONTRACT,
    data: CLAIM_CALLDATA,
    chainId: 1,
    gasLimit: '21000',
    maxFeePerGas: '2000000000',
    maxPriorityFeePerGas: '1000000000',
    nonce: '10',
} as const;

describe('claimSigningUtils', () => {
    it('builds Merkl claim calldata for claimable rewards', () => {
        expect(
            buildClaimCalldata({
                senderAddress: SENDER,
                rewards: [createReward()],
            }),
        ).toEqual(expect.stringMatching(/^0x71ee95c0/));
    });

    it('propagates Merkl claim calldata validation errors', () => {
        expect(() =>
            buildClaimCalldata({
                senderAddress: SENDER,
                rewards: [createReward('0x0000000000000000000000000000000000000000')],
            }),
        ).toThrow('ZERO_ADDRESS');
    });

    it('builds an unsigned EIP-1559 claim transaction for simulation', () => {
        expect(
            buildUnsignedClaimTransaction({
                contractAddress: CLAIM_CONTRACT,
                data: '0x1234',
                chainId: 1,
                fee: {
                    gasLimit: '21000',
                    maxFeePerGas: '2000000000',
                    maxPriorityFeePerGas: '1000000000',
                },
                nonce: '7',
            }),
        ).toEqual({
            to: CLAIM_CONTRACT,
            data: '0x1234',
            chainId: 1,
            gasLimit: '21000',
            maxFeePerGas: '2000000000',
            maxPriorityFeePerGas: '1000000000',
            nonce: '7',
        });
    });

    it('builds an unsigned legacy claim transaction for simulation', () => {
        expect(
            buildUnsignedClaimTransaction({
                contractAddress: CLAIM_CONTRACT,
                data: '0x1234',
                chainId: 1,
                fee: {
                    gasLimit: '21000',
                    gasPrice: '1000000000',
                },
                nonce: '7',
            }),
        ).toEqual({
            to: CLAIM_CONTRACT,
            data: '0x1234',
            chainId: 1,
            gasLimit: '21000',
            gasPrice: '1000000000',
            nonce: '7',
        });
    });

    it('builds EIP-1559 review state and signing payload', () => {
        const result = buildClaimTransactionReview({
            unsignedTransaction,
            selectedFee: {
                type: 'eip1559',
                gasLimit: '0x5208',
                maxFeePerGas: '0x77359400',
                maxPriorityFeePerGas: '0x3b9aca00',
                baseFeePerGas: '0x3b9aca00',
            },
            rewards: [createReward()],
        });

        expect(result.availableRewards).toEqual([{ tokenAddress: TOKEN, tokenSymbol: 'USDC' }]);
        expect(result.formState).toMatchObject({
            feeLimit: '21000',
            feePerUnit: '2',
            maxFeePerGas: '2',
            maxPriorityFeePerGas: '1',
            baseFeePerGas: '1',
            transactionData: CLAIM_CALLDATA,
        });
        expect(result.precomposedTransaction).toMatchObject({
            fee: '42000000000000',
            totalSpent: '42000000000000',
            feePerByte: '2',
            feeLimit: '21000',
            outputs: [{ address: CLAIM_CONTRACT, amount: '0' }],
            maxFeePerGas: '2',
            maxPriorityFeePerGas: '1',
        });
        expect(result.transactionForSigning).toEqual({
            to: CLAIM_CONTRACT,
            chainId: 1,
            value: '0x0',
            nonce: '0xa',
            data: CLAIM_CALLDATA,
            gasLimit: '0x5208',
            maxFeePerGas: '0x77359400',
            maxPriorityFeePerGas: '0x3b9aca00',
        });
    });

    it('builds legacy review state and signing payload', () => {
        const result = buildClaimTransactionReview({
            unsignedTransaction,
            selectedFee: {
                type: 'legacy',
                gasLimit: '0x5208',
                gasPrice: '0x3b9aca00',
            },
            rewards: [createReward()],
        });

        expect(result.formState).toMatchObject({
            feeLimit: '21000',
            feePerUnit: '1',
            maxFeePerGas: undefined,
            maxPriorityFeePerGas: undefined,
            baseFeePerGas: undefined,
        });
        expect(result.precomposedTransaction).toMatchObject({
            fee: '21000000000000',
            totalSpent: '21000000000000',
            feePerByte: '1',
            feeLimit: '21000',
        });
        expect(result.transactionForSigning).toEqual({
            to: CLAIM_CONTRACT,
            chainId: 1,
            value: '0x0',
            nonce: '0xa',
            data: CLAIM_CALLDATA,
            gasLimit: '0x5208',
            gasPrice: '0x3b9aca00',
        });
    });

    it('throws when review rewards do not match the claim calldata', () => {
        const selectedFee = {
            type: 'eip1559',
            gasLimit: '0x5208',
            maxFeePerGas: '0x77359400',
            maxPriorityFeePerGas: '0x3b9aca00',
            baseFeePerGas: '0x3b9aca00',
        } as const;

        expect(() =>
            buildClaimTransactionReview({
                unsignedTransaction,
                selectedFee,
                rewards: [createReward('0x1111111111111111111111111111111111111111')],
            }),
        ).toThrow('Claim rewards do not match the claim transaction data.');

        expect(() =>
            buildClaimTransactionReview({
                unsignedTransaction,
                selectedFee,
                rewards: [createReward(), createReward()],
            }),
        ).toThrow('Claim rewards do not match the claim transaction data.');
    });

    it('throws when the claim transaction data cannot be decoded', () => {
        expect(() =>
            buildClaimTransactionReview({
                unsignedTransaction: { ...unsignedTransaction, data: '0xabc' },
                selectedFee: {
                    type: 'eip1559',
                    gasLimit: '0x5208',
                    maxFeePerGas: '0x77359400',
                    maxPriorityFeePerGas: '0x3b9aca00',
                    baseFeePerGas: '0x3b9aca00',
                },
                rewards: [createReward()],
            }),
        ).toThrow('Failed to decode claim transaction data.');
    });

    it('throws when selected fee data is missing or incomplete', () => {
        expect(() =>
            buildClaimTransactionReview({
                unsignedTransaction,
                selectedFee: null,
                rewards: [createReward()],
            }),
        ).toThrow('Fee information is missing for the transaction.');

        expect(() =>
            buildClaimTransactionReview({
                unsignedTransaction,
                selectedFee: {
                    type: 'eip1559',
                    gasLimit: '0x5208',
                    maxFeePerGas: '0x77359400',
                },
                rewards: [createReward()],
            }),
        ).toThrow('Fee information is missing for the transaction.');
    });
});
