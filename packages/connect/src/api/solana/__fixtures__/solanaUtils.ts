import { AccountRole } from '@solana/web3.js';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import {
    TOKEN_PROGRAM_PUBLIC_KEY,
    SYSTEM_PROGRAM_PUBLIC_KEY,
    TOKEN_2022_PROGRAM_PUBLIC_KEY,
} from '@trezor/blockchain-link-utils/src/solana';

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
            description: 'builds token transfer instruction for the SPL Token program',
            input: {
                from: 'CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd',
                to: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                owner: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                amount: new BigNumber('1'),
                mint: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                decimals: 9,
                tokenProgramName: 'spl-token' as const,
            },
            expectedOutput: {
                accounts: [
                    {
                        address: 'CR6QfobBidQTSYdR6jihKTfMnHkRUtw8cLDCxENDVYmd',
                        role: AccountRole.WRITABLE,
                    },
                    {
                        address: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                        role: AccountRole.READONLY,
                    },
                    {
                        address: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                        role: AccountRole.WRITABLE,
                    },
                    expect.objectContaining({
                        address: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        role: AccountRole.READONLY_SIGNER,
                        signer: expect.objectContaining({
                            address: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        }),
                    }),
                ],
                data: new Uint8Array([12, 1, 0, 0, 0, 0, 0, 0, 0, 9]),
            },
        },
        {
            description: 'builds token transfer instruction for the Token 2022 program',
            input: {
                from: 'EdThAwDjfEj9joy2U7WvSsMwsHn5Wkby8R4j74qYJujz',
                to: '4Qon5ZG7yYRkheuUwdqwN9nGRgu7oYn9tAp5tkhE77Mi',
                owner: '6y2EP2MtSCuNE41h3gG9Fs7ZU2n24gcYiGqDpEYjDbRn',
                amount: new BigNumber('1'),
                mint: '8JH5uP374VW4YmVzE7LCRK9CbyRe1uXb85jK72RQzvWU',
                decimals: 9,
                tokenProgramName: 'spl-token-2022' as const,
            },
            expectedOutput: {
                accounts: [
                    {
                        address: 'EdThAwDjfEj9joy2U7WvSsMwsHn5Wkby8R4j74qYJujz',
                        role: AccountRole.WRITABLE,
                    },
                    {
                        address: '8JH5uP374VW4YmVzE7LCRK9CbyRe1uXb85jK72RQzvWU',
                        role: AccountRole.READONLY,
                    },
                    {
                        address: '4Qon5ZG7yYRkheuUwdqwN9nGRgu7oYn9tAp5tkhE77Mi',
                        role: AccountRole.WRITABLE,
                    },
                    expect.objectContaining({
                        address: '6y2EP2MtSCuNE41h3gG9Fs7ZU2n24gcYiGqDpEYjDbRn',
                        role: AccountRole.READONLY_SIGNER,
                        signer: expect.objectContaining({
                            address: '6y2EP2MtSCuNE41h3gG9Fs7ZU2n24gcYiGqDpEYjDbRn',
                        }),
                    }),
                ],
                data: new Uint8Array([12, 1, 0, 0, 0, 0, 0, 0, 0, 9]),
            },
        },
    ],
    buildCreateAssociatedTokenAccountInstruction: [
        {
            description:
                'builds create associated token account instruction for the SPL Token program',
            input: {
                funderAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                tokenMintAddress: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                newOwnerAddress: 'FAeNERRWGL8xtnwtM5dWBUs9Z1y5fenSJcawu55NQSWk',
                tokenProgramName: 'spl-token' as const,
            },
            expectedOutput: {
                pubkey: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                accounts: [
                    expect.objectContaining({
                        address: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        role: AccountRole.WRITABLE_SIGNER,
                        signer: expect.objectContaining({
                            address: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                        }),
                    }),
                    {
                        address: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                        role: AccountRole.WRITABLE,
                    },
                    {
                        address: 'FAeNERRWGL8xtnwtM5dWBUs9Z1y5fenSJcawu55NQSWk',
                        role: AccountRole.READONLY,
                    },
                    {
                        address: '6YuhWADZyAAxAaVKPm1G5N51RvDBXsnWo4SfsJ47wSoK',
                        role: AccountRole.READONLY,
                    },
                    {
                        address: SYSTEM_PROGRAM_PUBLIC_KEY,
                        role: AccountRole.READONLY,
                    },
                    {
                        address: TOKEN_PROGRAM_PUBLIC_KEY,
                        role: AccountRole.READONLY,
                    },
                ],
                data: new Uint8Array([]),
            },
        },
        {
            description:
                'builds create associated token account instruction for the Token 2022 program',
            input: {
                funderAddress: '8CxSyuSwEjUXU2ABWU2pFmvxwZR5aMmSxFQ4mAS7Kg4p',
                tokenMintAddress: '8JH5uP374VW4YmVzE7LCRK9CbyRe1uXb85jK72RQzvWU',
                newOwnerAddress: '6y2EP2MtSCuNE41h3gG9Fs7ZU2n24gcYiGqDpEYjDbRn',
                tokenProgramName: 'spl-token-2022' as const,
            },
            expectedOutput: {
                pubkey: 'EdThAwDjfEj9joy2U7WvSsMwsHn5Wkby8R4j74qYJujz',
                accounts: [
                    expect.objectContaining({
                        address: '8CxSyuSwEjUXU2ABWU2pFmvxwZR5aMmSxFQ4mAS7Kg4p',
                        role: AccountRole.WRITABLE_SIGNER,
                        signer: expect.objectContaining({
                            address: '8CxSyuSwEjUXU2ABWU2pFmvxwZR5aMmSxFQ4mAS7Kg4p',
                        }),
                    }),
                    {
                        address: 'EdThAwDjfEj9joy2U7WvSsMwsHn5Wkby8R4j74qYJujz',
                        role: AccountRole.WRITABLE,
                    },
                    {
                        address: '6y2EP2MtSCuNE41h3gG9Fs7ZU2n24gcYiGqDpEYjDbRn',
                        role: AccountRole.READONLY,
                    },
                    {
                        address: '8JH5uP374VW4YmVzE7LCRK9CbyRe1uXb85jK72RQzvWU',
                        role: AccountRole.READONLY,
                    },
                    {
                        address: SYSTEM_PROGRAM_PUBLIC_KEY,
                        role: AccountRole.READONLY,
                    },
                    {
                        address: TOKEN_2022_PROGRAM_PUBLIC_KEY,
                        role: AccountRole.READONLY,
                    },
                ],
                data: new Uint8Array([]),
            },
        },
    ],
    buildTokenTransferTransaction: [
        {
            description:
                'builds token transfer (SPL Token program) transaction in most common case',
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
                toTokenAccount: undefined,
                blockhash: '7xpT7BDE7q1ZWhe6Pg8PHRYbqgDwNK3L2v97rEfsjMkn',
                lastValidBlockHeight: 50,
                priorityFees: {
                    computeUnitPrice: '100000',
                    computeUnitLimit: '50000',
                },
                tokenProgramName: 'spl-token' as const,
            },
            expectedOutput:
                '01000609c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c6a99c9c4d0c7def9dd60a3a40dc5266faf41996310aa62ad6cbd9b64e1e2cca78ebaa24826cef9644c1ecf0dfcf955775b8438528e97820efc2b20ed46be1dc580000000000000000000000000000000000000000000000000000000000000000527706a12f3f7c3c852582f0f79b515c03c6ffbe6e3100044ba7c982eb5cf9f28c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f8590306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a40000000d27c181cb023db6239e22e49e4b67f7dd9ed13f3d7ed319f9e91b3bc64cec0a906ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a96772b7d36a2e66e52c817f385d7e94d3d4b6d47d7171c9f2dd86c6f1be1a93eb040600050250c3000006000903a0860100000000000506000207040308000804010402000a0c00e1f5050000000009',
        },
        {
            description:
                'builds token transfer transaction (SPL Token program) in the case an account already exists (simplest case, second most common)',
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
                toTokenAccount: {
                    publicKey: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                    balance: '600000000',
                },
                blockhash: '7xpT7BDE7q1ZWhe6Pg8PHRYbqgDwNK3L2v97rEfsjMkn',
                lastValidBlockHeight: 50,
                priorityFees: {
                    computeUnitPrice: '100000',
                    computeUnitLimit: '50000',
                },
                tokenProgramName: 'spl-token' as const,
            },
            expectedOutput:
                '01000306c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c6a99c9c4d0c7def9dd60a3a40dc5266faf41996310aa62ad6cbd9b64e1e2cca78ebaa24826cef9644c1ecf0dfcf955775b8438528e97820efc2b20ed46be1dc58527706a12f3f7c3c852582f0f79b515c03c6ffbe6e3100044ba7c982eb5cf9f20306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a96772b7d36a2e66e52c817f385d7e94d3d4b6d47d7171c9f2dd86c6f1be1a93eb030400050250c3000004000903a0860100000000000504010302000a0c00e1f5050000000009',
        },
        {
            description:
                'builds token transfer transaction (SPL Token program) in the case the destination is a token account (rare case, power user case)',
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
                toTokenAccount: undefined,
                blockhash: '7xpT7BDE7q1ZWhe6Pg8PHRYbqgDwNK3L2v97rEfsjMkn',
                lastValidBlockHeight: 50,
                priorityFees: {
                    computeUnitPrice: '100000',
                    computeUnitLimit: '50000',
                },
                tokenProgramName: 'spl-token' as const,
            },
            expectedOutput:
                '01000306c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c6a99c9c4d0c7def9dd60a3a40dc5266faf41996310aa62ad6cbd9b64e1e2cca78ebaa24826cef9644c1ecf0dfcf955775b8438528e97820efc2b20ed46be1dc58527706a12f3f7c3c852582f0f79b515c03c6ffbe6e3100044ba7c982eb5cf9f20306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a96772b7d36a2e66e52c817f385d7e94d3d4b6d47d7171c9f2dd86c6f1be1a93eb030400050250c3000004000903a0860100000000000504010302000a0c00e1f5050000000009',
        },
        {
            description:
                'builds token transfer (Token 2022 program) transaction in most common case',
            input: {
                fromAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                toAddress: 'FAeNERRWGL8xtnwtM5dWBUs9Z1y5fenSJcawu55NQSWk',
                toAddressOwner: SYSTEM_PROGRAM_PUBLIC_KEY,
                tokenMint: '8JH5uP374VW4YmVzE7LCRK9CbyRe1uXb85jK72RQzvWU',
                tokenUiAmount: '0.1',
                tokenDecimals: 9,
                fromTokenAccounts: [
                    {
                        publicKey: 'EdThAwDjfEj9joy2U7WvSsMwsHn5Wkby8R4j74qYJujz',
                        balance: '12200000000',
                    },
                ],
                toTokenAccount: undefined,
                blockhash: '7xpT7BDE7q1ZWhe6Pg8PHRYbqgDwNK3L2v97rEfsjMkn',
                lastValidBlockHeight: 50,
                priorityFees: {
                    computeUnitPrice: '100000',
                    computeUnitLimit: '50000',
                },
                tokenProgramName: 'spl-token-2022' as const,
            },
            expectedOutput:
                '01000609c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c6ca7f0545e6ff0eb69540020573c128136015f2a26163f90081ea42fb43be1665f18003838ed2728bc8bc4083dee3b9255492d2e65cf670bc2fdd51d1c32c499100000000000000000000000000000000000000000000000000000000000000006c6ede7c260ca13beca7a3017513ac103b5dad8335213f57d38b78967c6608b98c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f8590306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a40000000d27c181cb023db6239e22e49e4b67f7dd9ed13f3d7ed319f9e91b3bc64cec0a906ddf6e1ee758fde18425dbce46ccddab61afc4d83b90d27febdf928d8a18bfc6772b7d36a2e66e52c817f385d7e94d3d4b6d47d7171c9f2dd86c6f1be1a93eb040600050250c3000006000903a0860100000000000506000207040308000804010402000a0c00e1f5050000000009',
        },
        {
            description:
                'builds token transfer transaction (Token 2022 program) in the case an account already exists (simplest case, second most common)',
            input: {
                fromAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                toAddress: 'FAeNERRWGL8xtnwtM5dWBUs9Z1y5fenSJcawu55NQSWk',
                toAddressOwner: SYSTEM_PROGRAM_PUBLIC_KEY,
                tokenMint: '8JH5uP374VW4YmVzE7LCRK9CbyRe1uXb85jK72RQzvWU',
                tokenUiAmount: '0.1',
                tokenDecimals: 9,
                fromTokenAccounts: [
                    {
                        publicKey: 'EdThAwDjfEj9joy2U7WvSsMwsHn5Wkby8R4j74qYJujz',
                        balance: '12200000000',
                    },
                ],
                toTokenAccount: {
                    publicKey: '4Qon5ZG7yYRkheuUwdqwN9nGRgu7oYn9tAp5tkhE77Mi',
                    balance: '600000000',
                },
                blockhash: '7xpT7BDE7q1ZWhe6Pg8PHRYbqgDwNK3L2v97rEfsjMkn',
                lastValidBlockHeight: 50,
                priorityFees: {
                    computeUnitPrice: '100000',
                    computeUnitLimit: '50000',
                },
                tokenProgramName: 'spl-token-2022' as const,
            },
            expectedOutput:
                '01000306c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c632ac4f80897dd3abcbea173b042cdc1b710fab8b71bbe29ebc3328c1bc44c589ca7f0545e6ff0eb69540020573c128136015f2a26163f90081ea42fb43be16656c6ede7c260ca13beca7a3017513ac103b5dad8335213f57d38b78967c6608b90306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006ddf6e1ee758fde18425dbce46ccddab61afc4d83b90d27febdf928d8a18bfc6772b7d36a2e66e52c817f385d7e94d3d4b6d47d7171c9f2dd86c6f1be1a93eb030400050250c3000004000903a0860100000000000504020301000a0c00e1f5050000000009',
        },
        {
            description:
                'builds token transfer transaction (Token 2022 program) in the case the destination is a token account (rare case, power user case)',
            input: {
                fromAddress: 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF',
                toAddress: 'GrwHUG2U6Nmr2CHjQ2kesKzbjMwvCNytcMAbhQxq1Jyd',
                toAddressOwner: TOKEN_2022_PROGRAM_PUBLIC_KEY,
                tokenMint: '8JH5uP374VW4YmVzE7LCRK9CbyRe1uXb85jK72RQzvWU',
                tokenUiAmount: '0.1',
                tokenDecimals: 9,
                fromTokenAccounts: [
                    {
                        publicKey: 'EdThAwDjfEj9joy2U7WvSsMwsHn5Wkby8R4j74qYJujz',
                        balance: '12200000000',
                    },
                ],
                toTokenAccount: undefined,
                blockhash: '7xpT7BDE7q1ZWhe6Pg8PHRYbqgDwNK3L2v97rEfsjMkn',
                lastValidBlockHeight: 50,
                priorityFees: {
                    computeUnitPrice: '100000',
                    computeUnitLimit: '50000',
                },
                tokenProgramName: 'spl-token-2022' as const,
            },
            expectedOutput:
                '01000306c80f8b50107e9f3e3c16a661b8c806df454a6deb293d5e8730a9d28f2f4998c6ca7f0545e6ff0eb69540020573c128136015f2a26163f90081ea42fb43be1665ebaa24826cef9644c1ecf0dfcf955775b8438528e97820efc2b20ed46be1dc586c6ede7c260ca13beca7a3017513ac103b5dad8335213f57d38b78967c6608b90306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006ddf6e1ee758fde18425dbce46ccddab61afc4d83b90d27febdf928d8a18bfc6772b7d36a2e66e52c817f385d7e94d3d4b6d47d7171c9f2dd86c6f1be1a93eb030400050250c3000004000903a0860100000000000504010302000a0c00e1f5050000000009',
        },
    ],
};
