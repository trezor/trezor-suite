import type {
    CTAAction,
    Category,
    CountryCode,
    FirmwareVariant,
    Model,
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
    VARIANT_ENUM,
    VENDOR_ENUM,
} from './messageSystemConstants';

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

const featureItemSchema = yup
    .object({
        domain: yup
            .string()
            .oneOf(FEATURE_LIST, 'Select a valid feature from the list.')
            .required(),
        flag: yup.boolean().required(),
        visibleBanner: yup.string().optional(),
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

const deviceSchema = yup
    .object({
        model: yup.mixed<Model>().oneOf(MODEL_ENUM).required(),
        firmwareRevision: yup.string().required(),
        firmware: versionSchema,
        bootloader: versionSchema,
        variant: yup.mixed<FirmwareVariant>().oneOf(FW_VARIANT_ENUM).required(),
        vendor: yup.mixed<Vendor>().oneOf(VENDOR_ENUM).required(),
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
