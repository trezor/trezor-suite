import type {
    CTAAction,
    Category,
    CountryCode,
    FirmwareVariant,
    Model,
    PairingMethod,
    Variant,
    Vendor,
} from '@suite-common/suite-types';
import { yup } from '@suite-common/validators';

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

const onlyForDomain = <T extends yup.Schema<any>>(
    allowed: string | string[],
    schema: T,
    fieldLabel: string,
) =>
    yup.mixed().when('domain', {
        is: (d: string) => (Array.isArray(allowed) ? allowed.includes(d) : d === allowed),
        then: () => schema,
        otherwise: s =>
            s.test({
                name: 'forbidden-field',
                message: `${fieldLabel} is only allowed when domain is ${Array.isArray(allowed) ? allowed.join(' | ') : allowed}.`,
                test: v => v === undefined,
            }),
    }) as unknown as T;

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

const localizationSchema = yup.object({
    en: yup.string().defined(),
    es: yup.string().defined(),
    cs: yup.string().defined(),
    de: yup.string().defined(),
    fr: yup.string().defined(),
    pt: yup.string().defined(),
});

const ctaSchema = yup
    .object({
        action: yup.mixed<CTAAction>().oneOf(CTA_ACTION_ENUM).required(),
        link: yup.string().required(),
        anchor: yup.string().optional(),
        label: localizationSchema.required(),
    })
    .noUnknown(true);

const modalSchema = yup
    .object({
        title: localizationSchema.required(),
        image: yup.string().required(),
    })
    .noUnknown(true);

const surveyPayloadSchema = yup
    .object({
        title: localizationSchema.required(),
        description: localizationSchema.required(),
        cta: ctaSchema.required(),
    })
    .noUnknown(false);

export type TradingSurveyPayload = yup.InferType<typeof surveyPayloadSchema>;

export const validateTradingSurvey = (parsed: unknown) =>
    surveyPayloadSchema.validateSync(parsed, {
        abortEarly: false,
        strict: true,
    });

const featureItemSchema = yup
    .object({
        domain: yup
            .string()
            .oneOf(FEATURE_LIST, 'Select a valid feature from the list.')
            .required(),
        flag: yup.boolean().required(),
        payload: yup.lazy((_value, { parent }) => {
            if (parent.domain === 'trading.survey') {
                return surveyPayloadSchema;
            }

            return yup.object().optional().noUnknown(false);
        }),

        // legacy fields
        visibleBanner: onlyForDomain(
            'dashboard.promoBanner',
            yup.string().optional(),
            'visibleBanner',
        ),

        timeoutThresholdsPerModel: onlyForDomain(
            'security.firmware.hashCheck.timeout',
            yup.object().nullable().optional().noUnknown(false),
            'timeoutThresholdsPerModel',
        ),

        averageAnonymityGainPerRound: onlyForDomain(
            'coinjoin',
            yup.number().optional(),
            'averageAnonymityGainPerRound',
        ),
        roundsFailRateBuffer: onlyForDomain(
            'coinjoin',
            yup.number().optional(),
            'roundsFailRateBuffer',
        ),
        roundsDurationInHours: onlyForDomain(
            'coinjoin',
            yup.number().optional(),
            'roundsDurationInHours',
        ),
        maxMiningFeeModifier: onlyForDomain(
            'coinjoin',
            yup.number().optional(),
            'maxMiningFeeModifier',
        ),
        maxFeePerVbyte: onlyForDomain('coinjoin', yup.number().optional(), 'maxFeePerVbyte'),
        legalDocumentsVersion: onlyForDomain(
            'coinjoin',
            yup.number().optional(),
            'legalDocumentsVersion',
        ),
        isPublic: onlyForDomain('coinjoin', yup.number().optional(), 'isPublic'),
    })
    .noUnknown(true);

const featureSchema = yup.array(featureItemSchema).min(1);

const contextSchema = yup
    .object({
        domain: yup.lazy(value => {
            const base = yup
                .string()
                .defined()
                .test({
                    name: 'context-pattern',
                    message: 'Value does not match any known context pattern',
                    test: v =>
                        typeof v === 'string' &&
                        Object.values(CONTEXT_PATTERNS).some(({ regex }) => regex.test(v)),
                });

            return Array.isArray(value) ? yup.array(base).min(1).defined() : base;
        }),
    })
    .noUnknown(true);

const messageItemSchema = yup
    .object({
        id: yup.string().required(),
        priority: yup
            .number()
            .integer('Priority must be an integer')
            .min(0, 'Priority must be at least 0')
            .max(100, 'Priority cannot exceed 100')
            .required(),
        dismissible: yup.boolean().required(),
        variant: yup.mixed<Variant>().oneOf(VARIANT_ENUM).defined(),
        category: yup.lazy(value =>
            Array.isArray(value)
                ? yup.array(yup.mixed<Category>().oneOf(CATEGORY_ENUM).defined()).min(1).required()
                : yup.mixed<Category>().oneOf(CATEGORY_ENUM).required(),
        ),
        content: localizationSchema.required(),
        headline: localizationSchema.optional(),
        cta: ctaSchema.optional(),
        modal: modalSchema.optional(),
        feature: featureSchema.optional(),
        context: contextSchema.optional(),
    })
    .noUnknown(true);

const versionSchema = yup.lazy((v: unknown) =>
    Array.isArray(v) ? yup.array(yup.string().required()).required() : yup.string().required(),
);

const durationSchema = yup
    .object({
        from: yup.string().required(),
        to: yup.string().required(),
    })
    .required()
    .noUnknown(true);

const osSchema = yup
    .object({
        macos: versionSchema,
        linux: versionSchema,
        windows: versionSchema,
        android: versionSchema,
        ios: versionSchema,
        chromeos: versionSchema,
    })
    .noUnknown(true);

const environmentSchema = yup
    .object({
        desktop: versionSchema,
        mobile: versionSchema,
        web: versionSchema,
        revision: yup.string().optional(),
    })
    .noUnknown(true);

const browserSchema = yup
    .object({
        firefox: versionSchema,
        chrome: versionSchema,
        chromium: versionSchema,
    })
    .noUnknown(true);

const transportSchema = yup
    .object({
        bridge: versionSchema,
        webusbplugin: versionSchema,
    })
    .noUnknown(true);

const settingsSchema = yup.array(
    yup
        .object({
            tor: yup.boolean().optional(),
        })
        .noUnknown(false),
);

const thpPropertiesSchema = yup
    .object({
        internalModel: yup.string().optional(),
        modelVariant: yup.number().optional(),
        protocolVersionMajor: yup.number().optional(),
        protocolVersionMinor: yup.number().optional(),
        pairingMethods: yup.array(yup.mixed<PairingMethod>().oneOf(PAIRING_METHOD_ENUM)).optional(),
    })
    .noUnknown(true);

const deviceSchema = yup
    .object({
        model: yup.mixed<Model>().oneOf(MODEL_ENUM).required(),
        firmwareRevision: yup.string().required(),
        firmware: versionSchema,
        bootloader: versionSchema,
        variant: yup.mixed<FirmwareVariant>().oneOf(FW_VARIANT_ENUM).required(),
        vendor: yup.mixed<Vendor>().oneOf(VENDOR_ENUM).required(),
        thpProperties: thpPropertiesSchema.optional(),
    })
    .noUnknown(true);

const devicesSchema = yup.array(deviceSchema);

const countryCodesSchema = yup
    .array(
        yup
            .mixed<CountryCode>()
            .oneOf(COUNTRY_CODES, 'Country code must be 2 letters (ISO 3166-1 alpha-2).')
            .required(),
    )
    .min(1)
    .test('unique', 'countryCodes must be unique', arr => {
        if (!arr) return true;

        return new Set(arr).size === arr.length;
    });

const conditionItemSchema = yup
    .object({
        duration: durationSchema.optional(),
        os: osSchema.optional(),
        environment: environmentSchema.optional(),
        browser: browserSchema.optional(),
        transport: transportSchema.optional(),
        settings: settingsSchema.optional(),
        devices: devicesSchema.optional(),
        countryCodes: countryCodesSchema.optional(),
    })
    .noUnknown(true);

const ActionFormSchema = yup
    .object({
        message: messageItemSchema.required(),
        conditions: yup.array(conditionItemSchema).required(),
    })
    .required();

export const validateMessageForm = (parsed: unknown) =>
    ActionFormSchema.validateSync(parsed, {
        abortEarly: false,
        strict: true,
    });

const experimentGroupSchema = yup.object({
    variant: yup.string().required(),
    percentage: yup
        .number()
        .min(0, 'Percentage must be at least 0')
        .max(100, 'Percentage cannot exceed 100')
        .required(),
});

const experimentItemSchema = yup
    .object({
        id: yup.string().required(),
        groups: yup
            .array()
            .of(experimentGroupSchema)
            .min(1)
            .required()
            .test(
                'unique-variants',
                'Group variants must be unique within an experiment',
                groups =>
                    Array.isArray(groups)
                        ? new Set(groups.map(group => group.variant)).size === groups.length
                        : false,
            )
            .test('sum-100', 'Sum of percentages across groups must equal 100', groups => {
                if (!Array.isArray(groups)) return false;
                const sum = groups.reduce((acc, g) => acc + (g.percentage ?? 0), 0);

                return sum === 100;
            }),
    })
    .noUnknown(true);

const ExperimentFormSchema = yup
    .object({
        experiment: experimentItemSchema.required(),
        conditions: yup.array(conditionItemSchema).required(),
    })
    .required();

export const validateExperimentForm = (parsed: unknown) =>
    ExperimentFormSchema.validateSync(parsed, {
        abortEarly: false,
        strict: true,
    });
