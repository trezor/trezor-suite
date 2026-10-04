export type MockWireMessageVector = {
    description: string;
    name: string;
    data: Record<string, unknown>;
    /** Message id in the protocol v1 header. */
    messageType: number;
    /** The complete protocol v1 message: `?##`, message id, payload length and payload. */
    wireHex: string;
};

const HARDENED = 0x80000000;

const FINAL_SEQUENCE = 0xffffffff;

/**
 * Exact bytes of every message the migration sends, as old Trezor One firmware expects them.
 * Each vector was checked field by field against the protobuf definitions compiled into
 * firmware 1.3.6 and 1.6.3. If a schema change alters any of these bytes, old firmware may stop
 * understanding the message, and there is no emulator in CI that would notice.
 */
export const mockWireMessageVectors: MockWireMessageVector[] = [
    {
        description: 'Initialize without any field',
        name: 'Initialize',
        data: {},
        messageType: 0,
        wireHex: '3f2323000000000000',
    },
    {
        description: 'GetPublicKey of a BIP44 account with unpacked path items',
        name: 'GetPublicKey',
        data: { address_n: [HARDENED + 44, HARDENED, HARDENED] },
        messageType: 11,
        wireHex: '3f2323000b0000001208ac80808008088080808008088080808008',
    },
    {
        description: 'GetPublicKey of the verification child of a BIP84 account',
        name: 'GetPublicKey',
        data: { address_n: [HARDENED + 84, HARDENED, HARDENED + 1, 0] },
        messageType: 11,
        wireHex: '3f2323000b0000001408d4808080080880808080080881808080080800',
    },
    {
        description: 'SignTx with version 1 and no lock time',
        name: 'SignTx',
        data: { version: 1, inputs_count: 2, outputs_count: 1, coin_name: 'Bitcoin' },
        messageType: 15,
        wireHex: '3f2323000f0000000f080110021a07426974636f696e2001',
    },
    {
        description: 'TxAckInput for a legacy input, sent as the legacy TxAck message',
        name: 'TxAckInput',
        data: {
            tx: {
                input: {
                    address_n: [HARDENED + 44, HARDENED, HARDENED, 0, 5],
                    prev_index: 1,
                    prev_hash: 'aa'.repeat(32),
                    script_type: 'SPENDADDRESS',
                    amount: '123456789',
                    sequence: FINAL_SEQUENCE,
                },
            },
        },
        messageType: 22,
        wireHex:
            '3f232300160000004b0a49124708ac80808008088080808008088080808008080008051220aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa180128ffffffff0f300040959aef3a',
    },
    {
        description: 'TxAckInput for a P2SH-wrapped SegWit input',
        name: 'TxAckInput',
        data: {
            tx: {
                input: {
                    address_n: [HARDENED + 49, HARDENED, HARDENED, 1, 2],
                    prev_index: 0,
                    prev_hash: 'bb'.repeat(32),
                    script_type: 'SPENDP2SHWITNESS',
                    amount: '5000000000',
                    sequence: FINAL_SEQUENCE,
                },
            },
        },
        messageType: 22,
        wireHex:
            '3f232300160000004c0a4a124808b180808008088080808008088080808008080108021220bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb180028ffffffff0f30044080e497d012',
    },
    {
        description: 'TxAckInput for a native SegWit input',
        name: 'TxAckInput',
        data: {
            tx: {
                input: {
                    address_n: [HARDENED + 84, HARDENED, HARDENED, 0, 0],
                    prev_index: 3,
                    prev_hash: 'cc'.repeat(32),
                    script_type: 'SPENDWITNESS',
                    amount: '1000',
                    sequence: FINAL_SEQUENCE,
                },
            },
        },
        messageType: 22,
        wireHex:
            '3f23230016000000490a47124508d480808008088080808008088080808008080008001220cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc180328ffffffff0f300340e807',
    },
    {
        description: 'TxAckOutput paying an address, with the script type spelled out',
        name: 'TxAckOutput',
        data: {
            tx: {
                output: {
                    address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
                    amount: '123400000',
                    script_type: 'PAYTOADDRESS',
                },
            },
        },
        messageType: 22,
        wireHex:
            '3f232300160000002f0a2d2a2b0a22314276424d53455973745765747154466e354175346d3447466737784a614e564e3218c0deeb3a2000',
    },
    {
        description: 'TxAckOutput paying a P2SH address the way firmware before 1.5.0 needs it',
        name: 'TxAckOutput',
        data: {
            tx: {
                output: {
                    address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
                    amount: '99000',
                    script_type: 'PAYTOSCRIPTHASH',
                },
            },
        },
        messageType: 22,
        wireHex:
            '3f232300160000002e0a2c2a2a0a22334a393874315770455a3733434e6d5176696563726e796957726e715268574e4c7918b885062001',
    },
    {
        description: 'TxAckPrevMeta of a previous transaction',
        name: 'TxAckPrevMeta',
        data: { tx: { version: 1, lock_time: 0, inputs_count: 1, outputs_count: 2 } },
        messageType: 22,
        wireHex: '3f232300160000000a0a080801200030013802',
    },
    {
        description: 'TxAckPrevInput of a previous transaction',
        name: 'TxAckPrevInput',
        data: {
            tx: {
                input: {
                    prev_index: 1,
                    sequence: FINAL_SEQUENCE,
                    prev_hash: 'dd'.repeat(32),
                    script_sig: '483045',
                },
            },
        },
        messageType: 22,
        wireHex:
            '3f23230016000000330a31122f1220dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd1801220348304528ffffffff0f',
    },
    {
        description: 'TxAckPrevInput with the empty script signature of a SegWit spend',
        name: 'TxAckPrevInput',
        data: {
            tx: {
                input: {
                    prev_index: 0,
                    sequence: 0xfffffffd,
                    prev_hash: 'ee'.repeat(32),
                    script_sig: '',
                },
            },
        },
        messageType: 22,
        wireHex:
            '3f23230016000000300a2e122c1220eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee1800220028fdffffff0f',
    },
    {
        description: 'TxAckPrevOutput of a previous transaction',
        name: 'TxAckPrevOutput',
        data: {
            tx: {
                output: {
                    amount: '123456789',
                    script_pubkey: '76a91477bff20c60e522dfaa3350c39b030a5d004e839a88ac',
                },
            },
        },
        messageType: 22,
        wireHex:
            '3f23230016000000240a221a2008959aef3a121976a91477bff20c60e522dfaa3350c39b030a5d004e839a88ac',
    },
    {
        description: 'PinMatrixAck with matrix positions',
        name: 'PinMatrixAck',
        data: { pin: '7391' },
        messageType: 19,
        wireHex: '3f23230013000000060a0437333931',
    },
    {
        description: 'PassphraseAck with a passphrase',
        name: 'PassphraseAck',
        data: { passphrase: 'correct horse' },
        messageType: 42,
        wireHex: '3f2323002a0000000f0a0d636f727265637420686f727365',
    },
    {
        description: 'PassphraseAck with the empty passphrase still present as a field',
        name: 'PassphraseAck',
        data: { passphrase: '' },
        messageType: 42,
        wireHex: '3f2323002a000000020a00',
    },
    {
        description: 'ButtonAck',
        name: 'ButtonAck',
        data: {},
        messageType: 27,
        wireHex: '3f2323001b00000000',
    },
    {
        description: 'LockDevice, which old firmware knows as ClearSession',
        name: 'LockDevice',
        data: {},
        messageType: 24,
        wireHex: '3f2323001800000000',
    },
    {
        description: 'Cancel',
        name: 'Cancel',
        data: {},
        messageType: 20,
        wireHex: '3f2323001400000000',
    },
];
