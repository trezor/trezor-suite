import { z } from 'zod';

import { isHttps } from '@trezor/utils';

const defaultSandboxOptions = ['allow-forms', 'allow-scripts'];

/**
 * What a caller may opt a frame into on top of the default,
 * e.g. a payment sheet that opens in a window of its own.
 * A popup inherits the frame's sandbox, opaque origin included, unless it may escape it.
 */
const allowedSandboxOptions = [
    ...defaultSandboxOptions,
    'allow-popups',
    'allow-popups-to-escape-sandbox',
];

export const iframeUrl = z
    .url()
    .refine(url => isHttps(url))
    .transform(url => new URL(url));

export const iframeProps = z.object({
    src: iframeUrl,

    sandbox: z
        .string()
        .array()
        .refine(values => values.every(value => allowedSandboxOptions.includes(value)))
        .default(defaultSandboxOptions)
        .transform(values => values.join(' ')),

    referrerPolicy: z.enum(['no-referrer', 'strict-origin']).optional().default('no-referrer'),
});

export type UnknownIframeProps = z.input<typeof iframeProps>;
export type ParsedIframeProps = z.output<typeof iframeProps>;
