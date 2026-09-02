import { RuleTester } from 'eslint';
import { parser } from 'typescript-eslint';

import { enforceE2eTestStreamRule } from './rule';

const typescriptRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
    },
});

typescriptRuleTester.run('enforce-e2e-test-stream', enforceE2eTestStreamRule, {
    valid: [
        {
            code: "test('a', { annotation: createTestAnnotation({ stream: TestStream.Wallet }) }, async () => {});",
        },
        {
            code: "test('a', { ...tagOptions, annotation: createTestAnnotation({ stream: TestStream.Earn }) }, async () => {});",
        },
        {
            code: "test.skip('a', { annotation: createTestAnnotation({ stream: TestStream.Growth }) }, async () => {});",
        },
        // The metadata is typed by TestMetadataInput, so the rule does not inspect its contents.
        {
            code: "test('a', { annotation: createTestAnnotation(sharedMetadata) }, async () => {});",
        },
        // Tests are declared by test(), test.skip(), test.fixme() and test.only() only.
        { code: "test.describe('group', () => {});" },
        { code: "test.describe.skip('group', () => {});" },
        { code: 'test.use({ deviceSetup: {} });' },
        { code: 'test.beforeEach(async () => {});' },
        { code: "test.step('a step', async () => {});" },
        { code: "it('a jest test', async () => {});" },
    ],
    invalid: [
        {
            code: "test('a', async () => {});",
            errors: [{ messageId: 'missingOptions' }],
        },
        {
            code: "test.fixme('a', async () => {});",
            errors: [{ messageId: 'missingOptions' }],
        },
        {
            code: "test('a', { tag: ['@webOnly'] }, async () => {});",
            errors: [{ messageId: 'missingAnnotation' }],
        },
        {
            code: "test('a', { ...tagOptions }, async () => {});",
            errors: [{ messageId: 'missingAnnotation' }],
        },
        {
            code: "test('a', tagOptions, async () => {});",
            errors: [{ messageId: 'optionsNotObject', data: { name: 'tagOptions' } }],
        },
        {
            code: "test('a', { annotation: sharedAnnotation }, async () => {});",
            errors: [{ messageId: 'annotationShape' }],
        },
        {
            code: "test('a', { annotation: [{ type: 'stream', description: 'Wallet' }] }, async () => {});",
            errors: [{ messageId: 'annotationShape' }],
        },
    ],
} as Parameters<typeof typescriptRuleTester.run>[2]);
