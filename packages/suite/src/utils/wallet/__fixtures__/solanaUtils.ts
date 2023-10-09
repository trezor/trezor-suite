import {
    TOKEN_PROGRAM_PUBLIC_KEY,
    SYSTEM_PROGRAM_PUBLIC_KEY,
} from '@trezor/blockchain-link-utils/lib/solana';
import { SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

export const fixtures = {
    getMinimumRequiredTokenAccountsForTransfer: [
        {
            description: 'trivial case',
            input: {
                tokenAccounts: [
                    {
                        publicKey: 'irrelevant',
                        balance: '0.1',
                    },
                ],
                requiredAmount: '0.1',
            },
            expectedOutput: [
                {
                    publicKey: 'irrelevant',
                    balance: '0.1',
                },
            ],
        },
        {
            description: 'uses the largest account first',
            input: {
                tokenAccounts: [
                    {
                        publicKey: 'irrelevant',
                        balance: '0.1',
                    },
                    {
                        publicKey: 'irrelevant2',
                        balance: '0.3',
                    },
                    {
                        publicKey: 'irrelevant3',
                        balance: '0.5',
                    },
                    {
                        publicKey: 'largest',
                        balance: '1.12',
                    },
                    {
                        publicKey: 'irrelevant4',
                        balance: '0.8',
                    },
                ],
                requiredAmount: '0.1',
            },
            expectedOutput: [
                {
                    publicKey: 'largest',
                    balance: '1.12',
                },
            ],
        },
        {
            description: 'gets multiple accounts when necessary',
            input: {
                tokenAccounts: [
                    {
                        publicKey: 'irrelevant',
                        balance: '0.01',
                    },
                    {
                        publicKey: 'firstSelected',
                        balance: '0.3',
                    },
                    {
                        publicKey: 'secondSelected',
                        balance: '0.2',
                    },
                ],
                requiredAmount: '0.4',
            },
            expectedOutput: [
                {
                    publicKey: 'firstSelected',
                    balance: '0.3',
                },
                {
                    publicKey: 'secondSelected',
                    balance: '0.2',
                },
            ],
        },
    ],
    buildTokenTransferInstruction: [
        {
            description: 'builds token transfer instruction',
            input: {
                from: 'CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd',
                to: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                owner: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                amount: new BigNumber('0.1'),
                mint: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                decimals: 9,
            },
            expectedOutput: {
                keys: [
                    {
                        pubkey: 'CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd',
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        isSigner: true,
                        isWritable: false,
                    },
                ],
                data: Buffer.from([12, 0, 0, 0, 0, 0, 0, 0, 0, 9]),
            },
        },
    ],
    buildCreateAssociatedTokenAccountInstruction: [
        {
            description: 'builds create associated token account instruction',
            input: {
                funderAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                tokenMintAddress: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                newOwnerAddress: 'FAeNERRWGL8xtnwtM5dWBUs9Z1y5fenSJcawu55NQSWk',
            },
            expectedOutput: {
                pubkey: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                keys: [
                    {
                        pubkey: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        isSigner: true,
                        isWritable: true,
                    },
                    {
                        pubkey: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: 'FAeNERRWGL8xtnwtM5dWBUs9Z1y5fenSJcawu55NQSWk',
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: SYSTEM_PROGRAM_PUBLIC_KEY,
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: TOKEN_PROGRAM_PUBLIC_KEY,
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: SYSVAR_RENT_PUBKEY.toString(),
                        isSigner: false,
                        isWritable: false,
                    },
                ],
                data: Buffer.from([]),
            },
        },
    ],
    buildTokenTransferTransaction: [
        {
            description: 'builds token transfer transaction in most common case',
            input: {
                fromAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                toAddress: 'FAeNERRWGL8xtnwtM5dWBUs9Z1y5fenSJcawu55NQSWk',
                toAddressOwner: SYSTEM_PROGRAM_PUBLIC_KEY,
                tokenMint: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                tokenUiAmount: '0.1',
                tokenDecimals: 9,
                fromTokenAccounts: [
                    {
                        publicKey: 'CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd',
                        balance: '12200000000',
                    },
                ],
                toTokenAccounts: undefined,
                blockhash: '7xpT7BDE7q1ZWhe6Pg8PHRYbqgDwNK3L2v97rEfsjMkn',
                lastValidBlockHeight: 50,
            },
            expectedOutput:
                '01000609c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c6a99c9c4d0c7def9dd60a3a40dc5266faf41996310aa62ad6cbd9b64e1e2cca78ebaa24826cef9644c1ecf0dfcf955775b8438528e97820efc2b20ed46be1dc580000000000000000000000000000000000000000000000000000000000000000527706a12f3f7c3c852582f0f79b515c03c6ffbe6e3100044ba7c982eb5cf9f28c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859d27c181cb023db6239e22e49e4b67f7dd9ed13f3d7ed319f9e91b3bc64cec0a906a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a0000000006ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a96772b7d36a2e66e52c817f385d7e94d3d4b6d47d7171c9f2dd86c6f1be1a93eb02050700020604030807000804010402000a0c00e1f5050000000009',
        },
        {
            description:
                'builds token transfer transaction in the case an account already exists (simplest case, second most common)',
            input: {
                fromAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                toAddress: 'FAeNERRWGL8xtnwtM5dWBUs9Z1y5fenSJcawu55NQSWk',
                toAddressOwner: SYSTEM_PROGRAM_PUBLIC_KEY,
                tokenMint: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                tokenUiAmount: '0.1',
                tokenDecimals: 9,
                fromTokenAccounts: [
                    {
                        publicKey: 'CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd',
                        balance: '12200000000',
                    },
                ],
                toTokenAccounts: [
                    {
                        publicKey: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                        balance: '600000000',
                    },
                ],
                blockhash: '7xpT7BDE7q1ZWhe6Pg8PHRYbqgDwNK3L2v97rEfsjMkn',
                lastValidBlockHeight: 50,
            },
            expectedOutput:
                '01000205c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c6a99c9c4d0c7def9dd60a3a40dc5266faf41996310aa62ad6cbd9b64e1e2cca78ebaa24826cef9644c1ecf0dfcf955775b8438528e97820efc2b20ed46be1dc58527706a12f3f7c3c852582f0f79b515c03c6ffbe6e3100044ba7c982eb5cf9f206ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a96772b7d36a2e66e52c817f385d7e94d3d4b6d47d7171c9f2dd86c6f1be1a93eb010404010302000a0c00e1f5050000000009',
        },
        {
            description:
                'builds token transfer transaction in the case the destination is a token account (rare case, power user case)',
            input: {
                fromAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                toAddress: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                toAddressOwner: TOKEN_PROGRAM_PUBLIC_KEY,
                tokenMint: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                tokenUiAmount: '0.1',
                tokenDecimals: 9,
                fromTokenAccounts: [
                    {
                        publicKey: 'CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd',
                        balance: '12200000000',
                    },
                ],
                toTokenAccounts: undefined,
                blockhash: '7xpT7BDE7q1ZWhe6Pg8PHRYbqgDwNK3L2v97rEfsjMkn',
                lastValidBlockHeight: 50,
            },
            expectedOutput:
                '01000205c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c6a99c9c4d0c7def9dd60a3a40dc5266faf41996310aa62ad6cbd9b64e1e2cca78ebaa24826cef9644c1ecf0dfcf955775b8438528e97820efc2b20ed46be1dc58527706a12f3f7c3c852582f0f79b515c03c6ffbe6e3100044ba7c982eb5cf9f206ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a96772b7d36a2e66e52c817f385d7e94d3d4b6d47d7171c9f2dd86c6f1be1a93eb010404010302000a0c00e1f5050000000009',
        },
    ],
};
