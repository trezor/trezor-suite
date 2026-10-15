import { BigNumber } from '@trezor/utils';

import { createEvmDecoder } from './evm';
import { buildClaim } from '../builder/evm/claim';
import { buildTransfer } from '../builder/evm/transfer';
import { EVM_ABI } from '../constants/evm';
import { asEvmAddress } from '../types/evm';

const SENDER = asEvmAddress('0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3');
const RECIPIENT = asEvmAddress('0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96');
const TOKEN = asEvmAddress('0x58D97B57BB95320F9a05dC918Aef65434969c2B2');

describe('createEvmDecoder', () => {
    const decode = createEvmDecoder(EVM_ABI.erc20.transfer);

    const VALID_CALLDATA = buildTransfer(
        { to: RECIPIENT, amount: new BigNumber(1000) },
        { sender: SENDER },
    ).data!;

    it('decodes calldata to named params', () => {
        expect(decode(VALID_CALLDATA)).toEqual({
            to: RECIPIENT.toLowerCase(),
            amount: 1000n,
        });
    });

    it('returns null when data is undefined', () => {
        expect(decode(undefined)).toBeNull();
    });

    it('returns null when data is empty', () => {
        expect(decode('')).toBeNull();
    });

    it('returns null when selector does not match', () => {
        const wrongSelector = '0xdeadbeef' + VALID_CALLDATA.slice(10);
        expect(decode(wrongSelector)).toBeNull();
    });

    it('returns null for garbage payload after selector', () => {
        expect(decode(VALID_CALLDATA.slice(0, 10) + 'ff'.repeat(31))).toBeNull();
    });

    it('tolerates missing 0x prefix', () => {
        expect(decode(VALID_CALLDATA.slice(2))).toEqual({
            to: RECIPIENT.toLowerCase(),
            amount: 1000n,
        });
    });

    it('tolerates uppercase hex', () => {
        expect(decode(VALID_CALLDATA.toUpperCase())).toEqual({
            to: RECIPIENT.toLowerCase(),
            amount: 1000n,
        });
    });

    it('decodes zero-input functions to an empty object', () => {
        const depositDecode = createEvmDecoder(EVM_ABI.weth.deposit);
        // `deposit()` calldata is just the 4-byte selector, no arguments.
        expect(depositDecode('0xd0e30db0')).toEqual({});
    });

    it('lowercases addresses inside address[] params', () => {
        const arrayDecode = createEvmDecoder(EVM_ABI.distributor.claim);
        const calldata = buildClaim(
            {
                users: [SENDER],
                tokens: [TOKEN],
                amounts: [new BigNumber(1)],
                proofs: [[]],
            },
            { sender: SENDER },
        ).data!;

        expect(arrayDecode(calldata)).toMatchObject({
            users: [SENDER.toLowerCase()],
            tokens: [TOKEN.toLowerCase()],
        });
    });
});
