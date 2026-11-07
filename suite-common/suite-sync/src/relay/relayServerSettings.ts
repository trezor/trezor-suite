import { z } from 'zod';

import { isUrl } from '@trezor/utils';

export type SuiteSyncServerTypeOption<T> = {
    label: T;
    value: SuiteSyncServerTypeSelectValue;
};

export type SuiteSyncServerTypeSelectValue = 'default' | 'custom';

export const SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP: Record<
    SuiteSyncServerTypeSelectValue,
    { value: SuiteSyncServerTypeSelectValue }
> = {
    default: { value: 'default' },
    custom: { value: 'custom' },
};

export type ChangeServerModalFields = {
    server: SuiteSyncServerTypeSelectValue;
    customRelayUrl: string | null;
};

type CreateChangeSuiteSyncServerSchemaProps = {
    requiredTranslation: string;
    invalidUrlTranslation: string;
};

// NOTE: translations should not be passed as params, but rather we should return generic ERR from validation
export const createChangeSuiteSyncServerSchema = ({
    requiredTranslation,
    invalidUrlTranslation,
}: CreateChangeSuiteSyncServerSchemaProps) =>
    z
        .object({
            server: z.enum(['default', 'custom'] satisfies SuiteSyncServerTypeSelectValue[]),
            customRelayUrl: z.string().nullable(),
        })
        .superRefine(({ server, customRelayUrl }, context) => {
            if (server !== SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.custom.value) {
                return;
            }

            if (!customRelayUrl) {
                context.addIssue({
                    code: 'custom',
                    path: ['customRelayUrl'],
                    message: requiredTranslation,
                });
            } else if (!isUrl(customRelayUrl)) {
                context.addIssue({
                    code: 'custom',
                    path: ['customRelayUrl'],
                    message: invalidUrlTranslation,
                });
            }
        }) satisfies z.ZodType<ChangeServerModalFields, ChangeServerModalFields>;
