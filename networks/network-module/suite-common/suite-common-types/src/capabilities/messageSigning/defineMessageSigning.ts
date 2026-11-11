import { type Result, err } from '@trezor/type-utils';

import type {
    MessageSigning,
    MessageSigningDefinition,
    MessageSigningError,
    SignFormat,
    SignFormatChoice,
    SignFormatId,
} from './MessageSigning';
import type { OpenAccount } from '../OpenAccount';

const invalidParameter = (message: string): Result<never, MessageSigningError> =>
    err({ code: 'Method_InvalidParameter', message });

const UNSUPPORTED_ACCOUNT_MESSAGE = 'Account is not supported by this network.';

/**
 * The boundary between a family's closed sign/verify implementation and the open contract.
 *
 * Accounts are narrowed by the family's own `toAccount` on every call, and a format is accepted
 * only if the family offers it for that account. Rejections come back as results, the same way a
 * device failure does, so callers handle one shape.
 */
export const defineMessageSigning = <TAccount, TFormat extends SignFormatId = never>(
    definition: MessageSigningDefinition<TAccount, TFormat>,
): MessageSigning => {
    const getAvailableFormats = (account: TAccount): readonly TFormat[] =>
        definition.formats?.getAvailable(account) ?? [];

    // The only place a `SignFormat` is minted: it is always one this family offered.
    const toSignFormat = (format: TFormat): SignFormat => format as SignFormat;

    const getFormatChoice = (openAccount: OpenAccount): SignFormatChoice | null => {
        const account = definition.toAccount(openAccount);
        const { formats } = definition;

        if (account === undefined || formats === undefined) {
            return null;
        }

        const available = getAvailableFormats(account);

        if (available.length === 0) {
            return null;
        }

        return {
            kind: formats.kind,
            label: formats.label,
            tooltip: formats.tooltip,
            options: available.map(format => ({
                format: toSignFormat(format),
                label: formats.options[format],
            })),
        };
    };

    const { verify, showAddress } = definition;

    return {
        labels: definition.labels,
        addressSelection: definition.addressSelection,
        outputs: definition.outputs,
        getFormatChoice,
        getSignAddressGroups: ({ account: openAccount, touchedAddresses }) => {
            const account = definition.toAccount(openAccount);

            return account === undefined
                ? []
                : definition.getSignAddressGroups(account, touchedAddresses);
        },
        sign: async ({ account: openAccount, format, ...params }) => {
            const account = definition.toAccount(openAccount);

            if (account === undefined) {
                return invalidParameter(UNSUPPORTED_ACCOUNT_MESSAGE);
            }

            const requestedFormat: SignFormatId | undefined = format;
            const offeredFormat = getAvailableFormats(account).find(
                option => option === requestedFormat,
            );

            if (format !== undefined && offeredFormat === undefined) {
                return invalidParameter(`Format ${format} is not offered for this account.`);
            }

            return await definition.sign({ ...params, account, format: offeredFormat });
        },
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
