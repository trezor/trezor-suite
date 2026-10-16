import type { MockWireMessageVector } from './mockWireMessageVectors';

const HARDENED = 0x80000000;

/** 20 bytes of a destination, as hex. */
const TO = 'd8da6bf26964af9d7eed9e03e53415d37aa96045';

/**
 * Exact bytes of the Ethereum messages as firmware 1.4.2 to 1.6.3 expects them, computed by hand
 * from the field numbers compiled into that firmware:
 *
 * - `address_n` items are unpacked varints with tag 0x08 (field 1, varint). `44'` is
 *   0x8000002c, whose varint is `ac 80 80 80 08`; `60'` is `bc 80 80 80 08`; `61'` is
 *   `bd 80 80 80 08`; `0'` is `80 80 80 80 08`; `0` is `00`.
 * - Bytes fields carry tag `(field << 3) | 2` and a length: `nonce` 0x12, `gas_price` 0x1a,
 *   `gas_limit` 0x22, `to` 0x2a, `value` 0x32. Integers are big-endian without leading zeros.
 * - `chain_id` is field 9, varint: tag 0x48.
 * - The protocol v1 header is `?##`, the message id and the payload length, big-endian.
 */
export const mockLegacyEthereumWireVectors: MockWireMessageVector[] = [
    {
        description: 'EthereumGetAddress of the first Ethereum address, without show_display',
        name: 'EthereumGetAddress',
        data: { address_n: [HARDENED + 44, HARDENED + 60, HARDENED, 0, 0] },
        messageType: 56,
        wireHex: '3f232300380000001608ac8080800808bc8080800808808080800808000800',
    },
    {
        description: 'EthereumGetAddress of the eighth Ethereum Classic address',
        name: 'EthereumGetAddress',
        data: { address_n: [HARDENED + 44, HARDENED + 61, HARDENED, 0, 7] },
        messageType: 56,
        wireHex: '3f232300380000001608ac8080800808bd8080800808808080800808000807',
    },
    {
        description:
            'EthereumSignTx of 1 ETH with nonce 5 at 20 gwei, the destination as 20 bytes in field 5',
        name: 'EthereumSignTx',
        data: {
            address_n: [HARDENED + 44, HARDENED + 60, HARDENED, 0, 0],
            nonce: '05',
            gas_price: '04a817c800',
            gas_limit: '5208',
            to: TO,
            value: '0de0b6b3a7640000',
            chain_id: 1,
        },
        messageType: 58,
        wireHex: [
            '3f2323003a00000046',
            '08ac8080800808bc8080800808808080800808000800',
            '120105',
            '1a0504a817c800',
            '22025208',
            `2a14${TO}`,
            '32080de0b6b3a7640000',
            '4801',
        ].join(''),
    },
    {
        description:
            'EthereumSignTx of 1 wei on Ethereum Classic with nonce 0 sent as an empty field',
        name: 'EthereumSignTx',
        data: {
            address_n: [HARDENED + 44, HARDENED + 61, HARDENED, 0, 0],
            nonce: '',
            gas_price: '3b9aca00',
            gas_limit: '5208',
            to: TO,
            value: '01',
            chain_id: 61,
        },
        messageType: 58,
        wireHex: [
            '3f2323003a0000003d',
            '08ac8080800808bd8080800808808080800808000800',
            '1200',
            '1a043b9aca00',
            '22025208',
            `2a14${TO}`,
            '320101',
            '483d',
        ].join(''),
    },
];
