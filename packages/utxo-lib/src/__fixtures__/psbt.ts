export const PSBT_FIXTURES = [
    {
        description: 'parses the BIP174 valid vector with 0 inputs and 2 outputs',
        source: 'BIP174 test vector "PSBT with 0 inputs" from https://en.bitcoin.it/wiki/BIP_0174#Test_Vectors.',
        hex: '70736274ff01004c020000000002d3dff505000000001976a914d0c59903c5bac2868760e90fd521a4665aa7652088ac00e1f5050000000017a9143545e6e33b832c47050f24d3eeb93c9c03948bc787b32e1300000000',
        inputCount: 0,
        outputCount: 2,
    },
    {
        description: 'parses the bitcoinjs/bip174 addInputOutput round-trip vector',
        source: 'bitcoinjs/bip174 ts_src/tests/addInputOutput.ts from https://github.com/bitcoinjs/bip174.',
        hex: '70736274ff01009c0100000002d4a76ff95de1f4c0161a3e53ea876a91ed95331ae8d012d81f97138498ce5d860300000000ffffffffd4a76ff95de1f4c0161a3e53ea876a91ed95331ae8d012d81f97138498ce5dff0100000000ffffffff02d20296490000000017a914e18870f2c297fbfca54c5c6f645c7745a5b66eda87b168de3a0000000017a914e18870f2c297fbfca54c5c6f645c7745a5b66eda87000000000000000000',
        inputCount: 2,
        outputCount: 2,
    },
    {
        description:
            'parses a variant of the bitcoinjs/bip174 round-trip vector with the first output set to the suite fixture funded utxo address',
        source: 'Derived from bitcoinjs/bip174 ts_src/tests/addInputOutput.ts by replacing the first output script with bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk and resizing outputs to 4000 and 8000 sats.',
        hex: '70736274ff01009b0100000002d4a76ff95de1f4c0161a3e53ea876a91ed95331ae8d012d81f97138498ce5d860300000000ffffffffd4a76ff95de1f4c0161a3e53ea876a91ed95331ae8d012d81f97138498ce5dff0100000000ffffffff02a00f000000000000160014ece6935b2a5a5b5ff997c87370b16fa10f164410401f00000000000017a914e18870f2c297fbfca54c5c6f645c7745a5b66eda87000000000000000000',
        inputCount: 2,
        outputCount: 2,
    },
] as const;
