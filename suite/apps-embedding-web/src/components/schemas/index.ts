import { z } from 'zod';

import { isHttps } from '@trezor/utils';

const sandboxOptions = ['allow-forms', 'allow-scripts'];

export const iframeUrl = z
    .url()
    .refine(url => isHttps(url))
    .transform(url => new URL(url));

export const iframeProps = z.object({
    src: iframeUrl,

    sandbox: z
        .string()
        .array()
        .refine(values => values.every(value => sandboxOptions.includes(value)))
        .default(sandboxOptions)
        .transform(values => values.join(' ')),

    referrerPolicy: z.enum(['no-referrer', 'strict-origin']).optional().default('no-referrer'),
});

export type UnknownIframeProps = z.input<typeof iframeProps>;
export type ParsedIframeProps = z.output<typeof iframeProps>;
