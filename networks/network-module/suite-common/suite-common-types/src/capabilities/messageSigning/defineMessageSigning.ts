import { type Result, err, ok } from '@trezor/type-utils';
import { typedObjectKeys } from '@trezor/utils';

import type {
    FamilyMessageSigning,
    MessageSigningDefinition,
    MessageSigningError,
    SignChoice,
    SignChoiceOptionId,
    SignMessageBaseParams,
    SignParamOption,
    SignParams,
    SignSelection,
} from './MessageSigning';
import type { OpenAccount } from '../OpenAccount';

const invalidParameter = (message: string): Result<never, MessageSigningError> =>
    err({ code: 'Method_InvalidParameter', message });

const UNSUPPORTED_ACCOUNT_MESSAGE = 'Account is not supported by this network.';

// The only place a `SignChoiceOptionId` is minted: it is always the id of an option this family
// offered.
const toOptionId = (id: string) => id as SignChoiceOptionId;

/**
 * The boundary between a family's closed sign/verify implementation and the shared contract.
 *
 * Accounts are narrowed by the family's own `toAccount` on every call, and every parameter is
 * accepted only if the family offers it for that account, whether it arrives as an option id from
 * shared code or as a value from code that narrowed the network to the family. Rejections come back
 * as results, the same way a device failure does, so callers handle one shape.
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints — the
 * family states `TParams` once and every field, option and `sign` call is checked against it.
 */
export const defineMessageSigning = <TAccount, TParams extends SignParams = Record<never, never>>(
    definition: MessageSigningDefinition<TAccount, TParams>,
): FamilyMessageSigning<TParams> => {
    const paramKeys = typedObjectKeys(definition.params);

    const getChoices = (openAccount: OpenAccount): readonly SignChoice[] => {
        const account = definition.toAccount(openAccount);

        if (account === undefined) {
            return [];
        }

        return paramKeys.flatMap(key => {
            const field = definition.params[key];
            const options = field.getOptions(account);

            return options.length > 1
                ? [
                      {
                          key: String(key),
                          kind: field.kind,
                          label: field.label,
                          tooltip: field.tooltip,
                          options: options.map(option => ({
                              id: toOptionId(option.id),
                              label: option.label,
                          })),
                      },
                  ]
                : [];
        });
    };

    /**
     * Each parameter's value, from the option chosen for it. `pick` returns the chosen option, or
     * `undefined` when the choice names none the account was offered.
     */
    const resolveParams = (
        account: TAccount,
        pick: <TValue>(
            key: keyof TParams,
            options: readonly SignParamOption<TValue>[],
        ) => SignParamOption<TValue> | undefined,
    ): Result<TParams, MessageSigningError> => {
        const values: Partial<TParams> = {};

        for (const key of paramKeys) {
            const option = pick(key, definition.params[key].getOptions(account));

            if (option === undefined) {
                return invalidParameter(
                    `The value of ${String(key)} is not offered for this account.`,
                );
            }

            values[key] = option.value;
        }

        // Every key of `TParams` has a field, so the loop above assigned every key.
        return ok(values as TParams);
    };

    const signResolved = async (
        { account: openAccount, ...base }: SignMessageBaseParams,
        resolve: (account: TAccount) => Result<TParams, MessageSigningError>,
    ) => {
        const account = definition.toAccount(openAccount);

        if (account === undefined) {
            return invalidParameter(UNSUPPORTED_ACCOUNT_MESSAGE);
        }

        const params = resolve(account);

        if (!params.success) {
            return params;
        }

        return await definition.sign({ ...base, ...params.payload, account });
    };

    const fromSelection = (selection: SignSelection | undefined) => (account: TAccount) =>
        resolveParams(account, (key, options) => {
            const chosenId = selection?.[String(key)];

            return chosenId === undefined
                ? options[0]
                : options.find(option => option.id === chosenId);
        });

    const fromValues = (values: TParams) => (account: TAccount) =>
        resolveParams(account, (key, options) =>
            options.find(option => Object.is(option.value, values[key])),
        );

    const { verify, showAddress } = definition;

    return {
        labels: definition.labels,
        addressSelection: definition.addressSelection,
        outputs: definition.outputs,
        getChoices,
        getSignAddressGroups: ({ account: openAccount, touchedAddresses }) => {
            const account = definition.toAccount(openAccount);

            return account === undefined
                ? []
                : definition.getSignAddressGroups(account, touchedAddresses);
        },
        sign: ({ selection, ...base }) => signResolved(base, fromSelection(selection)),
        signWithParams: params => signResolved(params, fromValues(params)),
        verify:
            verify &&
            (async ({ account: openAccount, ...params }) => {
                const account = definition.toAccount(openAccount);

                return account === undefined
                    ? invalidParameter(UNSUPPORTED_ACCOUNT_MESSAGE)
                    : await verify({ ...params, account });
            }),
        showAddress:
            showAddress &&
            (async ({ account: openAccount, ...params }) => {
                const account = definition.toAccount(openAccount);

                return account === undefined
                    ? invalidParameter(UNSUPPORTED_ACCOUNT_MESSAGE)
                    : await showAddress({ ...params, account });
            }),
    };
};
