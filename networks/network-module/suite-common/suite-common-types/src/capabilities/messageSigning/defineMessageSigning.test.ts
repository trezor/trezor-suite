import { asNetworkSymbol } from '@trezor/network-module-types';
import { ok } from '@trezor/type-utils';

import type { MessageSigningDefinition, SignFormat } from './MessageSigning';
import { defineMessageSigning } from './defineMessageSigning';
import type { OpenAccount } from '../OpenAccount';

type TestAccount = { readonly path: string; readonly hasChoice: boolean };
type TestFormat = 'default' | 'electrum';

const LABEL = { id: 'TR_TEST', defaultMessage: 'Test' };

const openAccount: OpenAccount = {
    symbol: asNetworkSymbol('aaa'),
    accountType: 'normal',
    index: 0,
    path: "m/84'/0'/0'",
    descriptor: 'xpub',
};
const foreignAccount: OpenAccount = { ...openAccount, symbol: asNetworkSymbol('zzz') };
const singleFormatAccount: OpenAccount = { ...openAccount, accountType: 'legacy' };

const signedFormats: (TestFormat | undefined)[] = [];

const definition: MessageSigningDefinition<TestAccount, TestFormat> = {
    labels: { title: LABEL },
    addressSelection: 'pick',
    outputs: ['signature'],
    toAccount: account =>
        account.symbol === 'aaa'
            ? { path: account.path, hasChoice: account.accountType !== 'legacy' }
            : undefined,
    formats: {
        kind: 'signature',
        label: LABEL,
        options: { default: LABEL, electrum: { id: 'TR_ELECTRUM', defaultMessage: 'Electrum' } },
        getAvailable: account => (account.hasChoice ? ['default', 'electrum'] : []),
    },
    getSignAddressGroups: account => [
        { label: null, addresses: [{ path: account.path, address: 'addr' }] },
    ],
    sign: ({ format }) => {
        signedFormats.push(format);

        return Promise.resolve(ok({ signature: 'sig' }));
    },
};

const getOfferedFormats = (account: OpenAccount): SignFormat[] =>
    defineMessageSigning(definition)
        .getFormatChoice(account)
        ?.options.map(option => option.format) ?? [];

const SIGN_PARAMS = { device: {}, path: 'p', message: 'm', isHex: false };

describe('defineMessageSigning', () => {
    beforeEach(() => {
        signedFormats.length = 0;
    });

    it('offers the formats available for the account, with their labels', () => {
        const choice = defineMessageSigning(definition).getFormatChoice(openAccount);

        expect(choice?.kind).toBe('signature');
        expect(choice?.options.map(option => [option.format, option.label.id])).toEqual([
            ['default', 'TR_TEST'],
            ['electrum', 'TR_ELECTRUM'],
        ]);
    });

    it('offers no choice when the account has a single format or is foreign', () => {
        const signing = defineMessageSigning(definition);

        expect(signing.getFormatChoice(singleFormatAccount)).toBeNull();
        expect(signing.getFormatChoice(foreignAccount)).toBeNull();
    });

    it('signs with a format the family offered', async () => {
        const [, electrum] = getOfferedFormats(openAccount);

        const result = await defineMessageSigning(definition).sign({
            ...SIGN_PARAMS,
            account: openAccount,
            format: electrum,
        });

        expect(result).toEqual(ok({ signature: 'sig' }));
        expect(signedFormats).toEqual(['electrum']);
    });

    it('rejects a format the account was not offered without reaching the family', async () => {
        const [, electrum] = getOfferedFormats(openAccount);

        const result = await defineMessageSigning(definition).sign({
            ...SIGN_PARAMS,
            account: singleFormatAccount,
            format: electrum,
        });

        expect(result).toEqual({
            success: false,
            error: {
                code: 'Method_InvalidParameter',
                message: 'Format electrum is not offered for this account.',
            },
        });
        expect(signedFormats).toEqual([]);
    });

    it('rejects a foreign account on every call', async () => {
        const signing = defineMessageSigning(definition);

        const result = await signing.sign({ ...SIGN_PARAMS, account: foreignAccount });

        expect(result.success).toBe(false);
        expect(
            signing.getSignAddressGroups({ account: foreignAccount, touchedAddresses: [] }),
        ).toEqual([]);
    });

    it('supports verification only when the family implements it', () => {
        expect(defineMessageSigning(definition).verify).toBeUndefined();
        expect(
            defineMessageSigning({ ...definition, verify: () => Promise.resolve(ok()) }).verify,
        ).toBeDefined();
    });
});
