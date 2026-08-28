const DESCRIPTOR = 'GB635ARCRZOV7YZ5KC2BRIBFRHOCBJ5E35O76H3VUAMJP7UDTXFHG5C4';
const COUNTERPARTY = 'GBUV66LXXULKASZ5FSDJEY42HUWIBDF4MWSVDBUJLZKCFYSWT5SDPOQB';
const THIRD_PARTY = 'GCEEMZKTHUH44YRZWQLJK6HDHKYIM5K4UYFQJSUCODVLLL7SJEYAEOET';
const FEE_ACCOUNT = 'GA2JRQOF6EA3HQWDCEDBPPMLYPJCFLDDGYZLEQGMS5SOBQIB3BAFHVAW';
const USD_ISSUER = 'GCNY5OXYSY4FKHOPT2SPOQZAOEIGXB5LBYW3HVU3OWSTQITS65M5RCNY';
const CATCOIN_ISSUER = 'GDJVFDG5OCW5PYWHB64MGTHGFF57DRRJEDUEFDEL2SLNIOONHYJWHA3Z';

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

const invokeHostFunction = (assetBalanceChanges: Overrides[]) =>
    operation('invoke_host_function', {
        function: 'HostFunctionTypeHostFunctionTypeInvokeContract',
        asset_balance_changes: assetBalanceChanges,
    });

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

export const fixtures = {
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
            description: 'unsupported operation type',
            input: {
                descriptor: DESCRIPTOR,
                operations: [operation('set_options', { home_domain: 'stellar.org' })],
                tx: transaction(),
            },
            expectedOutput: output({ type: 'unknown' }),
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
            description: 'liquidity pool trustline is unsupported',
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
            expectedOutput: output({ type: 'unknown' }),
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
    ],
};
