import { RuleTester } from 'eslint';
import { parser } from 'typescript-eslint';

import { enforceNamedParameterTypesRule } from './rule';

const typescriptRuleTester = new RuleTester({
    languageOptions: {
        parser,
        parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
    },
});

typescriptRuleTester.run('enforce-named-parameter-types', enforceNamedParameterTypesRule, {
    valid: [
        {
            code: `
                    type FormatValueParams = { value: string };

                    const formatValue = ({ value }: FormatValueParams) => value;
                `,
        },
        {
            code: `
                    type AccountCardProps = { accountKey: string };

                    const AccountCard = ({ accountKey }: AccountCardProps) => accountKey;
                `,
        },
        {
            code: `
                    type FormatValueParams = { value: string };

                    function formatValue({ value }: FormatValueParams) {
                        return value;
                    }
                `,
        },
        {
            code: `
                    const formatValue = (params: { value: string }) => params.value;
                `,
        },
        {
            code: `
                    type FormatValueParams = { value: string };

                    const formatter = {
                        formatValue({ value }: FormatValueParams) {
                            return value;
                        },
                    };
                `,
        },
        {
            code: `
                    type ItemParams = { value: string };

                    items.map(({ value }: ItemParams) => value);
                `,
        },
        {
            code: `
                    items.map(({ value }) => value);
                `,
        },
        {
            code: `
                    type Item = { value: string };

                    items.map(({ value }: Item) => value);
                `,
        },
        {
            code: `
                    type NavigateToReviewParams = { transaction: string };

                    const navigateToReview = useCallback(
                        ({ transaction }: NavigateToReviewParams) => transaction,
                        [],
                    );
                `,
        },
        {
            code: `
                    type AccountCardProps = { accountKey: string };

                    const AccountCard = memo(({ accountKey }: AccountCardProps) => accountKey);
                `,
        },
        {
            code: `
                    callback(
                        ({ options }: yup.TestContext<SendFormContext>) => options,
                    );
                `,
        },
        {
            code: `
                    const formatValue = ({ value }) => value;
                `,
        },
        {
            code: `
                    type Services = {
                        formatValue: (params: { value: string }) => string;
                    };

                    const services: Services = {
                        formatValue: ({ value }) => value,
                    };
                `,
        },
        {
            code: `
                    type Callback = { getValue: () => string };
                    type Action = { result: string };

                    const actionCallback = (
                        { getValue }: Callback,
                        { result }: Action,
                    ) => getValue() + result;
                `,
        },
        {
            code: `
                    type Input = { value: string };

                    const formatValue = ({ value }: Input) => value;
                `,
        },
        {
            code: `
                    type Args = { value: string };

                    const formatValue = ({ value }: Args) => value;
                `,
        },
        {
            code: `
                    type CreateCardanoAccountProps = { value: string };

                    const createCardanoAccount = ({ value }: CreateCardanoAccountProps) => value;
                `,
        },
        {
            code: `
                    const formatValue = ({ value }: Wrapper<{ value: string }>) => value;
                `,
        },
        {
            code: `
                    items.map(({ value }: Pick<{ value: string }, 'value'>) => value);
                `,
        },
    ],
    invalid: [
        {
            code: `
                    const formatValue = ({ value }: { value: string }) => value;
                `,
            errors: [
                {
                    messageId: 'inlineObjectType',
                },
            ],
        },
        {
            code: `
                    type Callback = { getValue: () => string };

                    const actionCallback = (
                        { getValue }: Callback,
                        { result }: { result: string },
                    ) => getValue() + result;
                `,
            errors: [
                {
                    messageId: 'inlineObjectType',
                },
            ],
        },
        {
            code: `
                    function formatValue({ value }: { value: string }) {
                        return value;
                    }
                `,
            errors: [
                {
                    messageId: 'inlineObjectType',
                },
            ],
        },
        {
            code: `
                    const formatter = {
                        formatValue({ value }: { value: string }) {
                            return value;
                        },
                    };
                `,
            errors: [
                {
                    messageId: 'inlineObjectType',
                },
            ],
        },
        {
            code: `
                    items.map(({ value }: { value: string }) => value);
                `,
            errors: [
                {
                    messageId: 'inlineObjectType',
                },
            ],
        },
        {
            code: `
                    const navigateToReview = useCallback(
                        ({ transaction }: { transaction: string }) => transaction,
                        [],
                    );
                `,
            errors: [
                {
                    messageId: 'inlineObjectType',
                },
            ],
        },
    ],
} as Parameters<typeof typescriptRuleTester.run>[2]);
