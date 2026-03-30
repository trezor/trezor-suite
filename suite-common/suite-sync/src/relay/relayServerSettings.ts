import { yup } from '@suite-common/validators';

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
}: CreateChangeSuiteSyncServerSchemaProps): yup.ObjectSchema<ChangeServerModalFields> =>
    yup.object({
        server: yup
            .mixed<SuiteSyncServerTypeSelectValue>()
            .oneOf(['default', 'custom'] satisfies SuiteSyncServerTypeSelectValue[])
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
