import { asNetworkSymbol } from '@trezor/network-module-types';
import { ok } from '@trezor/type-utils';

import type { MessageSigningDefinition, SignChoiceOptionId } from './MessageSigning';
import { defineMessageSigning } from './defineMessageSigning';
import type { OpenAccount } from '../OpenAccount';

type TestAccount = { readonly path: string; readonly hasChoice: boolean };
type TestParams = { readonly format: 'default' | 'electrum'; readonly bip322: boolean };

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

const signedParams: TestParams[] = [];

const definition: MessageSigningDefinition<TestAccount, TestParams> = {
    labels: { title: LABEL },
    addressSelection: 'pick',
    outputs: ['signature'],
    toAccount: account =>
        account.symbol === 'aaa'
            ? { path: account.path, hasChoice: account.accountType !== 'legacy' }
            : undefined,
    params: {
        format: {
            kind: 'signature',
            label: LABEL,
            getOptions: account => [
                { id: 'default', label: LABEL, value: 'default' },
                ...(account.hasChoice
                    ? [
                          {
                              id: 'electrum',
                              label: { id: 'TR_ELECTRUM', defaultMessage: 'Electrum' },
                              value: 'electrum' as const,
                          },
                      ]
                    : []),
            ],
        },
        // A parameter the shared contract has never heard of: a family adds it on its own.
        bip322: {
            kind: 'signature',
            label: LABEL,
            getOptions: () => [
                { id: 'off', label: LABEL, value: false },
                { id: 'on', label: LABEL, value: true },
            ],
        },
    },
    getSignAddressGroups: account => [
        { category: 'account', label: null, addresses: [{ path: account.path, address: 'addr' }] },
    ],
    sign: ({ format, bip322 }) => {
        signedParams.push({ format, bip322 });

        return Promise.resolve(ok({ signature: 'sig' }));
    },
};

const getOptionId = (account: OpenAccount, key: string, id: string): SignChoiceOptionId => {
    const option = defineMessageSigning(definition)
        .getChoices(account)
        .find(choice => choice.key === key)
        ?.options.find(candidate => candidate.id === id);

    if (option === undefined) {
        throw new Error(`Option ${key}=${id} was not offered`);
    }

    return option.id;
};

const SIGN_PARAMS = { device: {}, path: 'p', message: 'm', isHex: false };

describe(defineMessageSigning.name, () => {
    beforeEach(() => {
        signedParams.length = 0;
    });

    it('offers each parameter that has more than one option, with its labels', () => {
        const choices = defineMessageSigning(definition).getChoices(openAccount);

        expect(choices.map(({ key, options }) => [key, options.map(option => option.id)])).toEqual([
            ['format', ['default', 'electrum']],
            ['bip322', ['off', 'on']],
        ]);
    });

    it('offers no choice for a parameter with a single option, nor for a foreign account', () => {
        const signing = defineMessageSigning(definition);

        expect(signing.getChoices(singleFormatAccount).map(({ key }) => key)).toEqual(['bip322']);
        expect(signing.getChoices(foreignAccount)).toEqual([]);
    });

    it('signs with the options chosen by id, and the first option of the rest', async () => {
        const result = await defineMessageSigning(definition).sign({
            ...SIGN_PARAMS,
            account: openAccount,
            selection: { bip322: getOptionId(openAccount, 'bip322', 'on') },
        });

        expect(result).toEqual(ok({ signature: 'sig' }));
        expect(signedParams).toEqual([{ format: 'default', bip322: true }]);
    });

    it('signs with values typed by the family', async () => {
        await defineMessageSigning(definition).signWithParams({
            ...SIGN_PARAMS,
            account: openAccount,
            format: 'electrum',
            bip322: false,
        });

        expect(signedParams).toEqual([{ format: 'electrum', bip322: false }]);
    });

    it('rejects an option the account was not offered without reaching the family', async () => {
        const signing = defineMessageSigning(definition);
        const electrum = getOptionId(openAccount, 'format', 'electrum');

        const byId = await signing.sign({
            ...SIGN_PARAMS,
            account: singleFormatAccount,
            selection: { format: electrum },
        });
        const byValue = await signing.signWithParams({
            ...SIGN_PARAMS,
            account: singleFormatAccount,
            format: 'electrum',
            bip322: false,
        });

        const rejection = {
            success: false,
            error: {
                code: 'Method_InvalidParameter',
                message: 'The value of format is not offered for this account.',
            },
        };
        expect(byId).toEqual(rejection);
        expect(byValue).toEqual(rejection);
        expect(signedParams).toEqual([]);
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
