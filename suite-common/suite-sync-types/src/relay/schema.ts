import { TranslationKey } from '@suite/intl';
import { yup } from '@suite-common/validators';
import { typedObjectValues } from '@trezor/utils';

export type SuiteSyncServerTypeOption<T> = {
    label: T;
    value: SuiteSyncServerTypeSelectValue;
};

export type SuiteSyncServerTypeOptionTranslated = SuiteSyncServerTypeOption<TranslationKey>;

export type SuiteSyncServerTypeSelectValue = 'default' | 'custom';

export const SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP: Record<
    SuiteSyncServerTypeSelectValue,
    SuiteSyncServerTypeOptionTranslated
> = {
    default: { label: 'TR_SUITE_SYNC_SERVER_TREZOR_DEFAULT', value: 'default' },
    custom: { label: 'TR_SUITE_SYNC_SERVER_CUSTOM', value: 'custom' },
};

export const SUITE_SYNC_SERVER_TYPE_OPTIONS = typedObjectValues(SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP);

export type ChangeServerModalFields = {
    server: SuiteSyncServerTypeSelectValue;
    customRelayUrl: string | null;
};

type CreateChangeSuiteSyncServerSchemaProps = {
    requiredTranslation: string;
    invalidUrlTranslation: string;
};

export const createChangeSuiteSyncServerSchema = ({
    requiredTranslation,
    invalidUrlTranslation,
}: CreateChangeSuiteSyncServerSchemaProps): yup.ObjectSchema<ChangeServerModalFields> =>
    yup.object({
        server: yup
            .mixed<SuiteSyncServerTypeSelectValue>()
            .oneOf(SUITE_SYNC_SERVER_TYPE_OPTIONS.map(option => option.value))
            .required(),
        customRelayUrl: yup
            .string()
            .nullable()
            .default(null)
            .when('server', {
                is: (server: SuiteSyncServerTypeSelectValue) =>
                    server === SUITE_SYNC_SERVER_TYPE_OPTIONS_MAP.custom.value,
                then: schema => schema.required(requiredTranslation).url(invalidUrlTranslation),
                otherwise: schema => schema.nullable().default(null),
            }),
    });
