import { RuleTester } from 'eslint';
import { parser } from 'typescript-eslint';

import { analyticsEventNameRule } from './rule';

const typescriptRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
    },
});

typescriptRuleTester.run('analytics-event-name', analyticsEventNameRule, {
    valid: [
        { code: "export enum EventType { Foo = 'settings/app-log-exported' }" },
        { code: "export enum EventType { Bar = 'dashboard/send-modal' }" },
        { code: "export enum EventType { Baz = 'wallet-connect/init' }" },
        { code: "export enum EventType { A = 'device/connect', B = 'receive/flow-entered' }" },
        { code: "export enum OtherEnum { X = 'anything' }" },
        { code: "const x = 'settings/foo';" },
    ],
    invalid: [
        {
            code: "export enum EventType { Bad = 'coin_discovery' }",
            errors: [{ messageId: 'invalidFormat' }],
        },
        {
            code: "export enum EventType { Bad = 'unknown-domain/event' }",
            errors: [{ messageId: 'invalidDomain', data: { domain: 'unknown-domain' } }],
        },
        {
            code: "export enum EventType { Bad = 'settings/appLogExported' }",
            errors: [{ messageId: 'notKebabCase', data: { eventPart: 'settings/appLogExported' } }],
        },
        {
            code: "export enum EventType { Bad = 'settings/device/change_pin' }",
            errors: [
                {
                    messageId: 'notKebabCase',
                    data: { eventPart: 'settings/device/change_pin' },
                },
            ],
        },
    ],
} as Parameters<typeof typescriptRuleTester.run>[2]);
