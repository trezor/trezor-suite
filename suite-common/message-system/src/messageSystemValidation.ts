import { z } from 'zod';

import { typedObjectKeys } from '@trezor/utils';

import {
    CATEGORY_ENUM,
    CONTEXT_PATTERNS,
    COUNTRY_CODES,
    CTA_ACTION_ENUM,
    FEATURE_LIST,
    FW_VARIANT_ENUM,
    MODEL_ENUM,
    PAIRING_METHOD_ENUM,
    VARIANT_ENUM,
    VENDOR_ENUM,
} from './messageSystemConstants';
import { Feature } from './messageSystemTypes';

export type ValidateError = { field?: string; message: string };

export const stripFieldFromMessage = (errors: ValidateError[]) =>
    errors.map(error => {
        if (!error.field) return error;

        const prefix = `${error.field}`;
        const message = error.message.startsWith(prefix)
            ? error.message.slice(prefix.length).trimStart()
            : error.message;

        return {
            ...error,
            message,
        };
    });

const REQUIRED_MESSAGE = 'is a required field';

const reportMissingValueAsRequired: z.core.$ZodErrorMap = issue =>
    issue.input === undefined ? REQUIRED_MESSAGE : undefined;

/**
 * Lists the problems found by `validateMessageForm`, `validateExperimentForm` or `validateTradingSurvey`,
 * or returns `undefined` when the error comes from elsewhere.
 */
export const getMessageSystemValidationErrors = (error: unknown): ValidateError[] | undefined =>
    error instanceof z.ZodError
        ? error.issues.map(({ path, message }) => ({
              field: path.length > 0 ? z.core.toDotPath(path) : 'value',
              message,
          }))
        : undefined;

const parseOrThrow = <T extends z.ZodType>(schema: T, value: unknown): z.output<T> =>
    schema.parse(value, { error: reportMissingValueAsRequired });

const requiredString = z.string().min(1, REQUIRED_MESSAGE);

const oneOrNonEmptyList = <T extends z.ZodType>(schema: T) =>
    z.union([z.array(schema).min(1), schema]);

const localizationSchema = z
    .object({
        en: z.string(),
        es: z.string(),
        cs: z.string(),
        de: z.string(),
        fr: z.string(),
        pt: z.string(),
    })
    .catchall(z.string());

const ctaSchema = z.strictObject({
    action: z.enum(CTA_ACTION_ENUM),
    link: requiredString,
    anchor: z.string().optional(),
    label: localizationSchema,
});

const modalSchema = z.strictObject({
    title: localizationSchema,
    image: requiredString,
});

const surveyPayloadSchema = z.looseObject({
    title: localizationSchema,
    description: localizationSchema,
    cta: ctaSchema,
});

export type TradingSurveyPayload = z.infer<typeof surveyPayloadSchema>;

export const validateTradingSurvey = (parsed: unknown) => parseOrThrow(surveyPayloadSchema, parsed);

const legacyFeatureFields = {
    visibleBanner: z.string().optional(),
    timeoutThresholdsPerModel: z.looseObject({}).nullable().optional(),
    averageAnonymityGainPerRound: z.number().optional(),
    roundsFailRateBuffer: z.number().optional(),
    roundsDurationInHours: z.number().optional(),
    maxMiningFeeModifier: z.number().optional(),
    maxFeePerVbyte: z.number().optional(),
    legalDocumentsVersion: z.number().optional(),
    isPublic: z.number().optional(),
};

const legacyFeatureFieldDomains: Record<keyof typeof legacyFeatureFields, string> = {
    visibleBanner: Feature.banners.dashboard.promo,
    timeoutThresholdsPerModel: Feature.firmwareHashCheckTimeout,
    averageAnonymityGainPerRound: Feature.coinjoin,
    roundsFailRateBuffer: Feature.coinjoin,
    roundsDurationInHours: Feature.coinjoin,
    maxMiningFeeModifier: Feature.coinjoin,
    maxFeePerVbyte: Feature.coinjoin,
    legalDocumentsVersion: Feature.coinjoin,
    isPublic: Feature.coinjoin,
};

const featureItemSchema = z
    .discriminatedUnion(
        'domain',
        [
            z.strictObject({
                domain: z.literal(Feature.trading.survey),
                flag: z.boolean(),
                payload: surveyPayloadSchema.optional(),
                ...legacyFeatureFields,
            }),
            z.strictObject({
                domain: z.enum(FEATURE_LIST.filter(feature => feature !== Feature.trading.survey)),
                flag: z.boolean(),
                payload: z.looseObject({}).optional(),
                ...legacyFeatureFields,
            }),
        ],
        { error: 'Select a valid feature from the list.' },
    )
    .superRefine((feature, context) => {
        typedObjectKeys(legacyFeatureFieldDomains).forEach(field => {
            const allowedDomain = legacyFeatureFieldDomains[field];

            if (feature[field] !== undefined && feature.domain !== allowedDomain) {
                context.addIssue({
                    code: 'custom',
                    path: [field],
                    message: `${field} is only allowed when domain is ${allowedDomain}.`,
                });
            }
        });
    });

const contextDomainSchema = z
    .string()
    .refine(
        domain => Object.values(CONTEXT_PATTERNS).some(({ regex }) => regex.test(domain)),
        'Value does not match any known context pattern',
    );

const contextSchema = z.strictObject({
    domain: oneOrNonEmptyList(contextDomainSchema),
});

const messageItemSchema = z.strictObject({
    id: requiredString,
    priority: z
        .number()
        .int('Priority must be an integer')
        .min(0, 'Priority must be at least 0')
        .max(100, 'Priority cannot exceed 100'),
    dismissible: z.boolean(),
    variant: z.enum(VARIANT_ENUM),
    category: oneOrNonEmptyList(z.enum(CATEGORY_ENUM)),
    content: localizationSchema,
    headline: localizationSchema.optional(),
    cta: ctaSchema.optional(),
    modal: modalSchema.optional(),
    feature: z.array(featureItemSchema).min(1).optional(),
    context: contextSchema.optional(),
});

const versionSchema = z.union([z.array(requiredString), requiredString]);

const durationSchema = z.strictObject({
    from: requiredString,
    to: requiredString,
});

const osSchema = z.strictObject({
    macos: versionSchema,
    linux: versionSchema,
    windows: versionSchema,
    android: versionSchema,
    ios: versionSchema,
    chromeos: versionSchema,
});

const environmentSchema = z.strictObject({
    desktop: versionSchema,
    mobile: versionSchema,
    web: versionSchema,
    revision: z.string().optional(),
});

const browserSchema = z.strictObject({
    firefox: versionSchema,
    chrome: versionSchema,
    chromium: versionSchema,
});

const transportSchema = z.strictObject({
    bridge: versionSchema,
    webusbplugin: versionSchema,
});

const settingsSchema = z.array(
    z.looseObject({
        tor: z.boolean().optional(),
    }),
);

const thpPropertiesSchema = z.strictObject({
    internalModel: z.string().optional(),
    modelVariant: z.number().optional(),
    protocolVersionMajor: z.number().optional(),
    protocolVersionMinor: z.number().optional(),
    pairingMethods: z.array(z.enum(PAIRING_METHOD_ENUM)).optional(),
});

const deviceSchema = z.strictObject({
    model: z.enum(MODEL_ENUM),
    firmwareRevision: requiredString,
    firmware: versionSchema,
    bootloader: versionSchema,
    variant: z.enum(FW_VARIANT_ENUM),
    vendor: z.enum(VENDOR_ENUM),
    thpProperties: thpPropertiesSchema.optional(),
});

const countryCodesSchema = z
    .array(z.enum(COUNTRY_CODES, 'Country code must be 2 letters (ISO 3166-1 alpha-2).'))
    .min(1)
    .refine(
        countryCodes => new Set(countryCodes).size === countryCodes.length,
        'countryCodes must be unique',
    );

const conditionItemSchema = z.strictObject({
    duration: durationSchema.optional(),
    os: osSchema.optional(),
    environment: environmentSchema.optional(),
    browser: browserSchema.optional(),
    transport: transportSchema.optional(),
    settings: settingsSchema.optional(),
    devices: z.array(deviceSchema).optional(),
    countryCodes: countryCodesSchema.optional(),
});

const actionFormSchema = z.looseObject({
    message: messageItemSchema,
    conditions: z.array(conditionItemSchema),
});

export const validateMessageForm = (parsed: unknown) => parseOrThrow(actionFormSchema, parsed);

const experimentGroupSchema = z.looseObject({
    variant: requiredString,
    percentage: z
        .number()
        .min(0, 'Percentage must be at least 0')
        .max(100, 'Percentage cannot exceed 100'),
});

const experimentItemSchema = z.strictObject({
    id: requiredString,
    name: z.string().optional(),
    groups: z
        .array(experimentGroupSchema)
        .min(1)
        .refine(
            groups => new Set(groups.map(group => group.variant)).size === groups.length,
            'Group variants must be unique within an experiment',
        )
        .refine(
            groups => groups.reduce((sum, group) => sum + group.percentage, 0) === 100,
            'Sum of percentages across groups must equal 100',
        ),
});

const experimentFormSchema = z.looseObject({
    experiment: experimentItemSchema,
    conditions: z.array(conditionItemSchema),
});

export const validateExperimentForm = (parsed: unknown) =>
    parseOrThrow(experimentFormSchema, parsed);
