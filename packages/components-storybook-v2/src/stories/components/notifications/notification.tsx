import React from 'react';
import { Notification } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

storiesOf('Notifications', module).add(
    'Notification',
    () => {
        const title: any = text('Title', 'The main message');
        const message: any = text(
            'Description',
            'Something else that needs to be told. This short message is optional and also not needed.'
        );
        const state: any = select(
            'State',
            {
                'Default (success)': null,
                Info: 'info',
                Warning: 'warning',
                Error: 'error',
            },
            null
        );
        const isLoading = boolean('Loading', false);
        const mainCta = boolean('Main CTA', false);

        if (mainCta) {
            const mainCtaLabel = text('Main CTA Label', 'Main CTA');
            const secondCta = boolean('Second CTA', false);
            const secondCtaLabel = text('Second CTA Label', 'Second CTA');

            return (
                <Notification
                    title={title}
                    {...(message ? { message } : {})}
                    {...(state ? { state } : {})}
                    {...(isLoading ? { isLoading } : {})}
                    mainCta={{
                        onClick: () => {},
                        label: mainCtaLabel,
                    }}
                    {...(secondCta
                        ? {
                              secondCta: {
                                  onClick: () => {},
                                  label: secondCtaLabel,
                              },
                          }
                        : {})}
                />
            );
        }

        return (
            <Notification
                title={title}
                {...(message ? { message } : {})}
                {...(state ? { state } : {})}
                {...(isLoading ? { isLoading } : {})}
            />
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { Notification } from '@trezor/components-v2';
            ~~~
            `,
        },
    }
);
