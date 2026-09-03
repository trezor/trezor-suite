// Recorded `getLedgerEntries` / `getLatestLedger` payloads: base64 XDR exactly as a
// stellar-rpc node returns it. Regenerate by re-encoding the entries below with
// @stellar/stellar-sdk if the protocol ever changes their layout.

export const HOLDER = 'GCATS5YOVB6ROX2WUNKGNQ2MP3GMXDMKSG2O4N5CLX3A6W4PZGZZI55U';
export const ISSUER = 'GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR';

export const ACCOUNT_KEY = 'AAAAAAAAAACBOXcOqH0XX1ajVGbDTH7My42KkbTuN6Jd9g9bj8mzlA==';

export const ACCOUNT_WITH_LIABILITIES_AND_SPONSORSHIP =
    'AAAAAAAAAACBOXcOqH0XX1ajVGbDTH7My42KkbTuN6Jd9g9bj8mzlAAAAABJlgLSA2heruLYAAEAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAHJw4AAAAAIAAAACAAAAAwAAAAAAAAAA';
const ACCOUNT_WITH_LIABILITIES_ONLY =
    'AAAAAAAAAACBOXcOqH0XX1ajVGbDTH7My42KkbTuN6Jd9g9bj8mzlAAAAABJlgLSA2heruLYAAEAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAHJw4AAAAAA=';
export const ACCOUNT_WITHOUT_EXTENSIONS =
    'AAAAAAAAAACBOXcOqH0XX1ajVGbDTH7My42KkbTuN6Jd9g9bj8mzlAAAAABJlgLSA2heruLYAAEAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export const TRUSTLINE_ALPHANUM4 =
    'AAAAAQAAAACBOXcOqH0XX1ajVGbDTH7My42KkbTuN6Jd9g9bj8mzlAAAAAFVU0RDAAAAAIqI4910CfGV/VLbLTy6XXLKZwm/HZQSG/N0iAG0D29cAAAAAAKupUB//////////wAAAAEAAAAA';
const TRUSTLINE_ALPHANUM12 =
    'AAAAAQAAAACBOXcOqH0XX1ajVGbDTH7My42KkbTuN6Jd9g9bj8mzlAAAAAJMT05HQVNTRVQxMjMAAAAAiojj3XQJ8ZX9UtstPLpdcspnCb8dlBIb83SIAbQPb1wAAAAAAA8bMH//////////AAAAAQAAAAA=';
const TRUSTLINE_POOL_SHARE =
    'AAAAAQAAAACBOXcOqH0XX1ajVGbDTH7My42KkbTuN6Jd9g9bj8mzlAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwAAAAAAACcQf/////////8AAAABAAAAAA==';

export const LEDGER_HEADER =
    'AAAAFwkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgAAAAAaLgqoAAAAAAAAAAABwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgOFy9sOoh6z7HlbYQAACjUjdyqFAAAAAAAAAAAAAAAAAAAAZABMS0AAAAPoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export const decodeAccountEntry = [
    {
        description: 'account with both the v1 (liabilities) and v2 (sponsorship) extensions',
        input: ACCOUNT_WITH_LIABILITIES_AND_SPONSORSHIP,
        expectedOutput: {
            balance: '1234567890',
            sequence: '245550284914819073',
            numSubEntries: 6,
            numSponsoring: 3,
            numSponsored: 2,
            sellingLiabilities: '7500000',
        },
    },
    {
        description: 'account with the v1 extension but no v2 sponsorship counters',
        input: ACCOUNT_WITH_LIABILITIES_ONLY,
        expectedOutput: {
            balance: '1234567890',
            sequence: '245550284914819073',
            numSubEntries: 6,
            numSponsoring: 0,
            numSponsored: 0,
            sellingLiabilities: '7500000',
        },
    },
    {
        description: 'account without any extension',
        input: ACCOUNT_WITHOUT_EXTENSIONS,
        expectedOutput: {
            balance: '1234567890',
            sequence: '245550284914819073',
            numSubEntries: 6,
            numSponsoring: 0,
            numSponsored: 0,
            sellingLiabilities: '0',
        },
    },
    {
        description: 'trustline entry is not an account',
        input: TRUSTLINE_ALPHANUM4,
        expectedOutput: undefined,
    },
];

export const decodeTrustlineEntry = [
    {
        description: 'alphanum4 trustline',
        input: TRUSTLINE_ALPHANUM4,
        expectedOutput: { assetCode: 'USDC', assetIssuer: ISSUER, balance: '45000000' },
    },
    {
        description: 'alphanum12 trustline',
        input: TRUSTLINE_ALPHANUM12,
        expectedOutput: { assetCode: 'LONGASSET123', assetIssuer: ISSUER, balance: '990000' },
    },
    {
        description: 'liquidity-pool share is not a renderable asset',
        input: TRUSTLINE_POOL_SHARE,
        expectedOutput: undefined,
    },
    {
        description: 'account entry is not a trustline',
        input: ACCOUNT_WITHOUT_EXTENSIONS,
        expectedOutput: undefined,
    },
];

// A `TransactionResult` rejecting a payment: txFailed / paymentSrcNoTrust.
export const TRANSACTION_RESULT_PAYMENT_SRC_NO_TRUST =
    'AAAAAAAAAGT/////AAAAAQAAAAAAAAAB/////QAAAAA=';
