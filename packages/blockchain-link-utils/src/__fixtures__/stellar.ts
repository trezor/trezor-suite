const DESCRIPTOR = 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4';
const COUNTERPARTY = 'GBUV66LXXULKASZ5FSDJEY42HUWIBDF4MWSVDBUJLZKCFYSWT5SDPOQB';
const THIRD_PARTY = 'GCEEMZKTHUH44YRZWQLJK6HDHKYIM5K4UYFQJSUCODVLLL7SJEYAEOET';
const FEE_ACCOUNT = 'GA2JRQOF6EA3HQWDCEDBPPMLYPJCFLDDGYZLEQGMS5SOBQIB3BAFHVAW';
const USD_ISSUER = 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY';
const CATCOIN_ISSUER = 'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z';

const ROUTER_CONTRACT = 'CAS3FL6TLZKDGGSISDBWGGPXT3NRR4DYTZD7YOD3HMYO6LTJUVGRVEAM';
const TOKEN_CONTRACT = 'CDWFVPEN2TZ4KL6QJBKMSI6PUF5IBJCH5VAZHIPQIL7VOF7ZBH6IXL75';

// `swap_chained(DESCRIPTOR, TOKEN_CONTRACT, 20000000, 19777295)` on ROUTER_CONTRACT, authorizing a
// nested `TOKEN_CONTRACT.transfer(DESCRIPTOR, ROUTER_CONTRACT, 20000000)` with source-account
// credentials. A contract token is not a Stellar Asset Contract, so Horizon reports no balance
// change for it and the envelope is the only record of what moved.
const CONTRACT_TOKEN_SWAP_ENVELOPE =
    'AAAAAgAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAABEwAAAAAAAAAAgAAAAEAAAAAAAAAAAAAAABqmWxYAAAAAAAAAAEAAAAAAAAAGAAAAAAAAAABJbKv015UMxpIkMNjGfee2xjweJ5H/Dh7OzDvLmmlTRoAAAAMc3dhcF9jaGFpbmVkAAAABAAAABIAAAAAAAAAAH2+giKOXV/jPVC0GKAlidwgp6TfXf8fdaAYl/6DncpzAAAAEgAAAAHsWryN1PPFL9BIVMkjz6F6gKRH7UGTofBC/1cX+Qn8iwAAAAkAAAAAAAAAAAAAAAABMS0AAAAACQAAAAAAAAAAAAAAAAEtxw8AAAABAAAAAAAAAAAAAAABJbKv015UMxpIkMNjGfee2xjweJ5H/Dh7OzDvLmmlTRoAAAAMc3dhcF9jaGFpbmVkAAAABAAAABIAAAAAAAAAAH2+giKOXV/jPVC0GKAlidwgp6TfXf8fdaAYl/6DncpzAAAAEgAAAAHsWryN1PPFL9BIVMkjz6F6gKRH7UGTofBC/1cX+Qn8iwAAAAkAAAAAAAAAAAAAAAABMS0AAAAACQAAAAAAAAAAAAAAAAEtxw8AAAABAAAAAAAAAAHsWryN1PPFL9BIVMkjz6F6gKRH7UGTofBC/1cX+Qn8iwAAAAh0cmFuc2ZlcgAAAAMAAAASAAAAAAAAAAB9voIijl1f4z1QtBigJYncIKek313/H3WgGJf+g53KcwAAABIAAAABJbKv015UMxpIkMNjGfee2xjweJ5H/Dh7OzDvLmmlTRoAAAAJAAAAAAAAAAAAAAAAATEtAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+gAAAAA';

// The root of the authorization tree repeats the invoked call, so both carry these arguments.
const SWAP_ARGS = [
    { kind: 'account', value: DESCRIPTOR },
    { kind: 'contract', value: TOKEN_CONTRACT },
    { kind: 'text', value: '20000000' },
    { kind: 'text', value: '19777295' },
] as const;

const TX_HASH = '0d9ebb6dc26097e5024994477dcbfdea2df7ba41caa204e885a85b51f10e30ef';
const LEDGER = 56802294;
const CREATED_AT = '2025-04-27T02:25:26Z';
const BLOCK_TIME = 1745720726;
const PAGING_TOKEN = '243963995068129280';

type Overrides = Record<string, unknown>;

const transaction = (overrides: Overrides = {}) => ({
    hash: TX_HASH,
    successful: true,
    created_at: CREATED_AT,
    fee_charged: '200',
    fee_account: DESCRIPTOR,
    source_account: DESCRIPTOR,
    ledger_attr: LEDGER,
    memo_type: 'none',
    ...overrides,
});

const operation = (type: string, overrides: Overrides = {}) => ({
    id: PAGING_TOKEN,
    paging_token: PAGING_TOKEN,
    transaction_hash: TX_HASH,
    source_account: DESCRIPTOR,
    type,
    ...overrides,
});

const payment = (overrides: Overrides = {}) =>
    operation('payment', {
        from: DESCRIPTOR,
        to: COUNTERPARTY,
        asset_type: 'native',
        amount: '1.0000000',
        ...overrides,
    });

const invokeHostFunction = (assetBalanceChanges: Overrides[] | null) =>
    operation('invoke_host_function', {
        function: 'HostFunctionTypeHostFunctionTypeInvokeContract',
        asset_balance_changes: assetBalanceChanges,
    });

const pathPayment = (overrides: Overrides = {}) =>
    operation('path_payment_strict_send', {
        from: DESCRIPTOR,
        to: DESCRIPTOR,
        source_asset_type: 'native',
        source_amount: '1.0000000',
        asset_type: 'credit_alphanum4',
        asset_code: 'USD',
        asset_issuer: USD_ISSUER,
        amount: '25.7585344',
        destination_min: '25.0000000',
        path: [],
        ...overrides,
    });

const createClaimableBalance = (overrides: Overrides = {}) =>
    operation('create_claimable_balance', {
        asset: `USD:${USD_ISSUER}`,
        amount: '0.4347826',
        claimants: [{ destination: DESCRIPTOR, predicate: { unconditional: true } }],
        ...overrides,
    });

// An effect belongs to an operation through the `<operation id>-<index>` of its paging token.
const effect = (index: number, type: string, overrides: Overrides = {}) => ({
    id: `${PAGING_TOKEN}-${index}`,
    paging_token: `${PAGING_TOKEN}-${index}`,
    account: DESCRIPTOR,
    type,
    ...overrides,
});

const accountCredited = (index: number, overrides: Overrides = {}) =>
    effect(index, 'account_credited', { asset_type: 'native', amount: '1.0000000', ...overrides });

const accountDebited = (index: number, overrides: Overrides = {}) =>
    effect(index, 'account_debited', { asset_type: 'native', amount: '1.0000000', ...overrides });

const balanceChange = (overrides: Overrides = {}) => ({
    asset_type: 'credit_alphanum4',
    asset_code: 'USD',
    asset_issuer: USD_ISSUER,
    type: 'transfer',
    from: COUNTERPARTY,
    to: DESCRIPTOR,
    amount: '1.0000000',
    ...overrides,
});

const output = (overrides: Overrides = {}) => ({
    txid: TX_HASH,
    amount: '0',
    fee: '200',
    blockTime: BLOCK_TIME,
    blockHeight: LEDGER,
    targets: [],
    tokens: [],
    internalTransfers: [],
    feeRate: undefined,
    details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
    stellarSpecific: { memo: undefined, feeSource: DESCRIPTOR },
    ...overrides,
});

const nativeOutput = (type: 'sent' | 'recv', from: string, to: string, amount: string) =>
    output({
        type,
        amount,
        targets: [{ n: 0, addresses: [to], isAddress: true, amount }],
        details: {
            vin: [{ n: 0, addresses: [from], isAddress: true, value: amount }],
            vout: [{ n: 0, addresses: [to], isAddress: true, value: amount }],
            size: 0,
            totalInput: amount,
            totalOutput: amount,
        },
    });

const token = (overrides: Overrides = {}) => ({
    type: 'recv',
    standard: 'STELLAR-CLASSIC',
    from: COUNTERPARTY,
    to: DESCRIPTOR,
    contract: `USD-${USD_ISSUER}`,
    name: 'USD',
    symbol: 'USD',
    decimals: 7,
    amount: '10000000',
    ...overrides,
});

type Fixture = {
    description: string;
    input: {
        descriptor: string;
        operations: Overrides[];
        tx: Overrides;
        /** The account's Horizon effects for the operations, when the transaction has any. */
        effects?: Overrides[];
    };
    expectedOutput: Overrides;
};

export const fixtures: { transformTransaction: Fixture[] } = {
    transformTransaction: [
        {
            description: 'account takes part in several operations of one transaction',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment(), payment({ amount: '2.0000000' })],
                tx: transaction({ operation_count: 2 }),
            },
            expectedOutput: output({ type: 'unknown' }),
        },
        {
            description: 'failed transaction',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment()],
                tx: transaction({ successful: false }),
            },
            expectedOutput: output({ type: 'failed' }),
        },
        {
            description: 'an operation that only changes the ledger is named, not flagged',
            input: {
                descriptor: DESCRIPTOR,
                operations: [operation('set_options', { home_domain: 'stellar.org' })],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'self',
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'setOptions',
                },
            }),
        },
        {
            description: 'native payment sent',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment()],
                tx: transaction(),
            },
            expectedOutput: nativeOutput('sent', DESCRIPTOR, COUNTERPARTY, '10000000'),
        },
        {
            description: 'native payment received',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment({ from: COUNTERPARTY, to: DESCRIPTOR })],
                tx: transaction({ source_account: COUNTERPARTY, fee_account: COUNTERPARTY }),
            },
            expectedOutput: {
                ...nativeOutput('recv', COUNTERPARTY, DESCRIPTOR, '10000000'),
                stellarSpecific: { memo: undefined, feeSource: COUNTERPARTY },
            },
        },
        {
            description: 'native payment between other accounts',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment({ from: COUNTERPARTY, to: THIRD_PARTY })],
                tx: transaction({ source_account: COUNTERPARTY, fee_account: COUNTERPARTY }),
            },
            expectedOutput: output({
                type: 'unknown',
                stellarSpecific: { memo: undefined, feeSource: COUNTERPARTY },
            }),
        },
        {
            description: 'credit payment sent',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    payment({
                        asset_type: 'credit_alphanum4',
                        asset_code: 'USD',
                        asset_issuer: USD_ISSUER,
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'sent',
                tokens: [token({ type: 'sent', from: DESCRIPTOR, to: COUNTERPARTY })],
            }),
        },
        {
            description: 'credit payment received with a 12 character asset code',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    payment({
                        from: COUNTERPARTY,
                        to: DESCRIPTOR,
                        asset_type: 'credit_alphanum12',
                        asset_code: 'CATCOIN',
                        asset_issuer: CATCOIN_ISSUER,
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'recv',
                tokens: [
                    token({
                        contract: `CATCOIN-${CATCOIN_ISSUER}`,
                        name: 'CATCOIN',
                        symbol: 'CATCOIN',
                    }),
                ],
            }),
        },
        {
            description: 'payment of liquidity pool shares is unsupported',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment({ asset_type: 'liquidity_pool_shares' })],
                tx: transaction(),
            },
            expectedOutput: output({ type: 'unknown' }),
        },
        {
            description: 'account created by the descriptor',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    operation('create_account', {
                        funder: DESCRIPTOR,
                        account: COUNTERPARTY,
                        starting_balance: '5.0000000',
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: nativeOutput('sent', DESCRIPTOR, COUNTERPARTY, '50000000'),
        },
        {
            description: 'descriptor account was created by someone else',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    operation('create_account', {
                        funder: COUNTERPARTY,
                        account: DESCRIPTOR,
                        starting_balance: '5.0000000',
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: nativeOutput('recv', COUNTERPARTY, DESCRIPTOR, '50000000'),
        },
        {
            description: 'trustline added',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    operation('change_trust', {
                        asset_type: 'credit_alphanum4',
                        asset_code: 'USD',
                        asset_issuer: USD_ISSUER,
                        trustor: DESCRIPTOR,
                        limit: '922337203685.4775807',
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'self',
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'changeTrust',
                    changeTrust: { assetCode: 'USD', isRemoval: false },
                },
            }),
        },
        {
            description: 'trustline removed',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    operation('change_trust', {
                        asset_type: 'credit_alphanum4',
                        asset_code: 'USD',
                        asset_issuer: USD_ISSUER,
                        trustor: DESCRIPTOR,
                        limit: '0.0000000',
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'self',
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'changeTrust',
                    changeTrust: { assetCode: 'USD', isRemoval: true },
                },
            }),
        },
        {
            description: 'a liquidity pool trustline is named, since it has no asset code to show',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    operation('change_trust', {
                        asset_type: 'liquidity_pool_shares',
                        liquidity_pool_id: 'abc',
                        trustor: DESCRIPTOR,
                        limit: '922337203685.4775807',
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'self',
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'changeTrust',
                },
            }),
        },
        {
            description: 'transaction contains text memo',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment()],
                tx: transaction({ memo_type: 'text', memo: 'trezor stellar' }),
            },
            expectedOutput: {
                ...nativeOutput('sent', DESCRIPTOR, COUNTERPARTY, '10000000'),
                stellarSpecific: { memo: 'trezor stellar', feeSource: DESCRIPTOR },
            },
        },
        {
            description: 'transaction contains id memo',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment()],
                tx: transaction({ memo_type: 'id', memo: '1234567890' }),
            },
            expectedOutput: {
                ...nativeOutput('sent', DESCRIPTOR, COUNTERPARTY, '10000000'),
                stellarSpecific: { memo: '1234567890', feeSource: DESCRIPTOR },
            },
        },
        {
            description: 'hash memo is converted from base64 to hex',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment()],
                tx: transaction({ memo_type: 'hash', memo: '3q2+7w==' }),
            },
            expectedOutput: {
                ...nativeOutput('sent', DESCRIPTOR, COUNTERPARTY, '10000000'),
                stellarSpecific: { memo: 'deadbeef', feeSource: DESCRIPTOR },
            },
        },
        {
            description: 'return hash memo is converted from base64 to hex',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment()],
                tx: transaction({ memo_type: 'return', memo: '3q2+7w==' }),
            },
            expectedOutput: {
                ...nativeOutput('sent', DESCRIPTOR, COUNTERPARTY, '10000000'),
                stellarSpecific: { memo: 'deadbeef', feeSource: DESCRIPTOR },
            },
        },
        {
            description: 'fee-bump transaction is attributed to the fee account',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment()],
                tx: transaction({ fee_account: FEE_ACCOUNT, fee_charged: '35602' }),
            },
            expectedOutput: {
                ...nativeOutput('sent', DESCRIPTOR, COUNTERPARTY, '10000000'),
                fee: '35602',
                stellarSpecific: { memo: undefined, feeSource: FEE_ACCOUNT },
            },
        },
        {
            description: 'Stellar Asset Contract transfer received',
            input: {
                descriptor: DESCRIPTOR,
                operations: [invokeHostFunction([balanceChange()])],
                tx: transaction(),
            },
            expectedOutput: output({ type: 'recv', tokens: [token()] }),
        },
        {
            description: 'Stellar Asset Contract transfer sent',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    invokeHostFunction([balanceChange({ from: DESCRIPTOR, to: COUNTERPARTY })]),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'sent',
                tokens: [token({ type: 'sent', from: DESCRIPTOR, to: COUNTERPARTY })],
            }),
        },
        {
            description: 'minted asset has no sender, so the issuer stands in',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    invokeHostFunction([{ ...balanceChange({ type: 'mint' }), from: undefined }]),
                ],
                tx: transaction(),
            },
            expectedOutput: output({ type: 'recv', tokens: [token({ from: USD_ISSUER })] }),
        },
        {
            description: 'burned asset has no recipient, so the issuer stands in',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    invokeHostFunction([
                        { ...balanceChange({ type: 'burn', from: DESCRIPTOR }), to: undefined },
                    ]),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'sent',
                tokens: [token({ type: 'sent', from: DESCRIPTOR, to: USD_ISSUER })],
            }),
        },
        {
            description: 'every balance change of one operation becomes a token transfer',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    invokeHostFunction([
                        balanceChange({ amount: '0.1447280' }),
                        balanceChange({ amount: '0.1723958' }),
                    ]),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'recv',
                tokens: [token({ amount: '1447280' }), token({ amount: '1723958' })],
            }),
        },
        {
            description: 'balance changes between other participants are ignored',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    invokeHostFunction([
                        balanceChange({ from: COUNTERPARTY, to: THIRD_PARTY }),
                        balanceChange({ amount: '2.0000000' }),
                    ]),
                ],
                tx: transaction(),
            },
            expectedOutput: output({ type: 'recv', tokens: [token({ amount: '20000000' })] }),
        },
        {
            description: 'host function call that moved no balances at all',
            input: {
                descriptor: DESCRIPTOR,
                // Horizon sends `null` here, not an empty array.
                operations: [invokeHostFunction(null)],
                tx: transaction(),
            },
            expectedOutput: output({ type: 'unknown' }),
        },
        {
            description: 'host function call the account does not take part in',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    invokeHostFunction([balanceChange({ from: COUNTERPARTY, to: THIRD_PARTY })]),
                ],
                tx: transaction(),
            },
            expectedOutput: output({ type: 'unknown' }),
        },
        {
            description: 'contract-token call without balance changes keeps its decoded call',
            input: {
                descriptor: DESCRIPTOR,
                operations: [invokeHostFunction([])],
                tx: transaction({ envelope_xdr: CONTRACT_TOKEN_SWAP_ENVELOPE }),
            },
            expectedOutput: output({
                type: 'contract',
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    contractCall: {
                        contractId: ROUTER_CONTRACT,
                        functionName: 'swap_chained',
                        args: SWAP_ARGS,
                        authorizedCalls: [
                            {
                                contractId: ROUTER_CONTRACT,
                                functionName: 'swap_chained',
                                depth: 0,
                                args: SWAP_ARGS,
                            },
                            {
                                contractId: TOKEN_CONTRACT,
                                functionName: 'transfer',
                                depth: 1,
                                args: [
                                    { kind: 'account', value: DESCRIPTOR },
                                    { kind: 'contract', value: ROUTER_CONTRACT },
                                    { kind: 'text', value: '20000000' },
                                ],
                            },
                        ],
                    },
                },
            }),
        },
        {
            description: 'host function call with an unreadable envelope stays unknown',
            input: {
                descriptor: DESCRIPTOR,
                operations: [invokeHostFunction([])],
                tx: transaction({ envelope_xdr: 'not-xdr' }),
            },
            expectedOutput: output({ type: 'unknown' }),
        },
        {
            description: 'host function call moving only non-classic assets',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    invokeHostFunction([
                        {
                            asset_type: 'native',
                            type: 'transfer',
                            from: COUNTERPARTY,
                            to: DESCRIPTOR,
                            amount: '1.0000000',
                        },
                    ]),
                ],
                tx: transaction(),
            },
            expectedOutput: output({ type: 'unknown' }),
        },
        {
            description: 'swapping one asset for another is reported as a self transfer',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    invokeHostFunction([
                        balanceChange({ from: DESCRIPTOR, to: COUNTERPARTY }),
                        balanceChange({
                            asset_type: 'credit_alphanum12',
                            asset_code: 'CATCOIN',
                            asset_issuer: CATCOIN_ISSUER,
                            from: COUNTERPARTY,
                            to: DESCRIPTOR,
                            amount: '3.0000000',
                        }),
                    ]),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'self',
                tokens: [
                    token({ type: 'sent', from: DESCRIPTOR, to: COUNTERPARTY }),
                    token({
                        contract: `CATCOIN-${CATCOIN_ISSUER}`,
                        name: 'CATCOIN',
                        symbol: 'CATCOIN',
                        amount: '30000000',
                    }),
                ],
            }),
        },
        {
            description: 'a swap of lumens for an asset is reported with both of its legs',
            input: {
                descriptor: DESCRIPTOR,
                operations: [pathPayment()],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'self',
                amount: '10000000',
                targets: [{ n: 0, addresses: [DESCRIPTOR], isAddress: true, amount: '10000000' }],
                tokens: [
                    token({ type: 'recv', from: DESCRIPTOR, to: DESCRIPTOR, amount: '257585344' }),
                ],
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'pathPayment',
                },
            }),
        },
        {
            // The mirror of the case above: the lumens arrive, so they cannot be reported as an
            // amount with a target, which the shared shape reads as "sent".
            description: 'a swap of an asset for lumens reports the lumens as arriving',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    pathPayment({
                        source_asset_type: 'credit_alphanum4',
                        source_asset_code: 'USD',
                        source_asset_issuer: USD_ISSUER,
                        source_amount: '25.7585344',
                        asset_type: 'native',
                        asset_code: undefined,
                        asset_issuer: undefined,
                        amount: '1.0000000',
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'self',
                amount: '0',
                internalTransfers: [
                    { type: 'recv', from: DESCRIPTOR, to: DESCRIPTOR, amount: '10000000' },
                ],
                tokens: [
                    token({ type: 'sent', from: DESCRIPTOR, to: DESCRIPTOR, amount: '257585344' }),
                ],
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'pathPayment',
                },
            }),
        },
        {
            // Both legs are lumens, so the account only moved their difference — reading one leg
            // alone would report the whole amount sent and drop the credit that came back.
            description: 'a round trip through the order books reports what the account netted',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    pathPayment({
                        source_amount: '1.0000000',
                        asset_type: 'native',
                        asset_code: undefined,
                        asset_issuer: undefined,
                        amount: '1.0100000',
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'self',
                amount: '100000',
                targets: [{ n: 0, addresses: [DESCRIPTOR], isAddress: true, amount: '100000' }],
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'pathPayment',
                },
            }),
        },
        {
            description: 'a path payment to another account reports only the leg that left',
            input: {
                descriptor: DESCRIPTOR,
                operations: [pathPayment({ to: COUNTERPARTY })],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'sent',
                amount: '10000000',
                targets: [{ n: 0, addresses: [COUNTERPARTY], isAddress: true, amount: '10000000' }],
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'pathPayment',
                },
            }),
        },
        {
            description: 'a path payment from another account reports only the leg that arrived',
            input: {
                descriptor: DESCRIPTOR,
                operations: [pathPayment({ from: COUNTERPARTY })],
                tx: transaction({ source_account: COUNTERPARTY, fee_account: COUNTERPARTY }),
            },
            expectedOutput: output({
                type: 'recv',
                tokens: [token({ from: COUNTERPARTY, amount: '257585344' })],
                stellarSpecific: {
                    memo: undefined,
                    feeSource: COUNTERPARTY,
                    operationType: 'pathPayment',
                },
            }),
        },
        {
            description: "a path payment between other accounts is not the account's business",
            input: {
                descriptor: DESCRIPTOR,
                operations: [pathPayment({ from: COUNTERPARTY, to: THIRD_PARTY })],
                tx: transaction({ source_account: COUNTERPARTY, fee_account: COUNTERPARTY }),
            },
            expectedOutput: output({
                type: 'unknown',
                stellarSpecific: { memo: undefined, feeSource: COUNTERPARTY },
            }),
        },
        {
            description: 'a claimable balance offered to the account carries no amount',
            input: {
                descriptor: DESCRIPTOR,
                operations: [createClaimableBalance({ source_account: COUNTERPARTY })],
                tx: transaction({ source_account: COUNTERPARTY, fee_account: COUNTERPARTY }),
            },
            expectedOutput: output({
                type: 'recv',
                stellarSpecific: {
                    memo: undefined,
                    feeSource: COUNTERPARTY,
                    operationType: 'createClaimableBalance',
                    claimableBalanceOffer: { isClaimant: true, offeredAmount: '4347826' },
                },
            }),
        },
        {
            description: 'a claimable balance the account created is a send',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    createClaimableBalance({
                        claimants: [
                            { destination: COUNTERPARTY, predicate: { unconditional: true } },
                        ],
                    }),
                ],
                tx: transaction(),
            },
            expectedOutput: output({
                type: 'sent',
                tokens: [
                    token({ type: 'sent', from: DESCRIPTOR, to: COUNTERPARTY, amount: '4347826' }),
                ],
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'createClaimableBalance',
                    claimableBalanceOffer: { isClaimant: false, offeredAmount: '4347826' },
                },
            }),
        },
        {
            description: 'an operation nobody enumerated is described by its effects',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    operation('account_merge', { account: DESCRIPTOR, into: COUNTERPARTY }),
                ],
                tx: transaction(),
                effects: [accountDebited(1, { amount: '5.0000000' })],
            },
            expectedOutput: output({
                type: 'sent',
                amount: '50000000',
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'accountMerge',
                },
            }),
        },
        {
            description:
                'a crossing offer is read from the trade effect that is all Horizon reports',
            input: {
                descriptor: DESCRIPTOR,
                operations: [operation('manage_sell_offer', { offer_id: '1' })],
                tx: transaction(),
                effects: [
                    effect(1, 'trade', {
                        seller: COUNTERPARTY,
                        offer_id: '1',
                        sold_asset_type: 'native',
                        sold_amount: '2.0000000',
                        bought_asset_type: 'credit_alphanum4',
                        bought_asset_code: 'USD',
                        bought_asset_issuer: USD_ISSUER,
                        bought_amount: '4.0000000',
                    }),
                ],
            },
            expectedOutput: output({
                type: 'self',
                amount: '20000000',
                targets: [],
                tokens: [token({ from: USD_ISSUER, amount: '40000000' })],
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'offer',
                },
            }),
        },
        {
            description: 'claiming a claimable balance is the credit the offer was not',
            input: {
                descriptor: DESCRIPTOR,
                operations: [
                    operation('claim_claimable_balance', {
                        balance_id: '00000000',
                        claimant: DESCRIPTOR,
                    }),
                ],
                tx: transaction(),
                effects: [accountCredited(1, { amount: '0.4347826' })],
            },
            expectedOutput: output({
                type: 'recv',
                amount: '4347826',
                // The account is the one that received them, as in a plain payment
                targets: [{ n: 0, addresses: [DESCRIPTOR], isAddress: true, amount: '4347826' }],
                stellarSpecific: {
                    memo: undefined,
                    feeSource: DESCRIPTOR,
                    operationType: 'claimClaimableBalance',
                },
            }),
        },
        {
            description: 'several operations of one transaction are netted into one record',
            input: {
                descriptor: DESCRIPTOR,
                operations: [payment(), payment({ amount: '2.0000000' })],
                tx: transaction({ operation_count: 2 }),
                effects: [
                    accountDebited(1, { amount: '1.0000000' }),
                    accountDebited(2, { amount: '2.0000000' }),
                ],
            },
            expectedOutput: output({ type: 'sent', amount: '30000000' }),
        },
    ],
};
