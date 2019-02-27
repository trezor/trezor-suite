import React from 'react';
import Button from 'components/buttons/Button';
import ButtonPin from 'components/buttons/Pin';
import ButtonNotification from 'components/buttons/Notification';
import { storiesOf } from '@storybook/react';
import {
    withKnobs, text, boolean, select,
} from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';

import colors from 'config/colors';
import icons from 'config/icons';

storiesOf('Components', module)
    .addDecorator(
        withInfo({
            header: false,
            inline: true,
            maxPropsIntoLine: 1,
            styles: {
                infoStory: {
                    background: colors.LANDING,
                    borderBottom: `1px solid ${colors.DIVIDER}`,
                    padding: '30px',
                    margin: '-8px',
                },
                infoBody: {
                    border: 'none',
                    padding: '15px',
                },
            },
            excludedPropTypes: ['children', 'icon', 'className'],
        }),
    )
    .addDecorator(withKnobs)
    .add('Button', () => {
        const isInverse = boolean('Inverse', false);
        const isDisabled = boolean('Disabled', false);
        const buttonText = text('Text', 'Button text');
        const icon = select('Icon', {
            None: null,
            TOP: icons.TOP,
            EYE_CROSSED: icons.EYE_CROSSED,
            EYE: icons.EYE,
            CHECKED: icons.CHECKED,
            BACK: icons.BACK,
            HELP: icons.HELP,
            REFRESH: icons.REFRESH,
            T1: icons.T1,
            COG: icons.COG,
            EJECT: icons.EJECT,
            CLOSE: icons.CLOSE,
            DOWNLOAD: icons.DOWNLOAD,
            PLUS: icons.PLUS,
            ARROW_UP: icons.ARROW_UP,
            ARROW_LEFT: icons.ARROW_LEFT,
            ARROW_DOWN: icons.ARROW_DOWN,
            CHAT: icons.CHAT,
            SKIP: icons.SKIP,
            WARNING: icons.WARNING,
            INFO: icons.INFO,
            ERROR: icons.ERROR,
            SUCCESS: icons.SUCCESS,
        }, null);

        if (isInverse) {
            return (
                <Button
                    isDisabled={isDisabled}
                    isInverse={isInverse}
                    icon={icon}
                >
                    {buttonText}
                </Button>
            );
        }

        const isTransparent = boolean('Transparent', false);
        const isWhite = boolean('White', false);

        return (
            <Button
                isDisabled={isDisabled}
                isTransparent={isTransparent}
                isWhite={isWhite}
                icon={icon}
            >
                {buttonText}
            </Button>
        );
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { Button } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Button Pin', () => (
        <ButtonPin onClick={() => {}} />
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { ButtonPin } from 'trezor-ui-components';
            ~~~
            `,
        },
    })
    .add('Button Notification', () => {
        const type = select('Type', {
            Success: 'success',
            Warning: 'warning',
            Error: 'error',
        }, 'success');
        const loading = boolean('Loading', false);
        const buttonText = text('Text', 'Confirm!');

        if (loading) {
            return (
                <ButtonNotification
                    type={type}
                    isLoading
                >{buttonText}
                </ButtonNotification>
            );
        }
        return (
            <ButtonNotification type={type}>
                {buttonText}
            </ButtonNotification>
        );
    }, {
        info: {
            text: `
            ## Import
            ~~~js
            import { ButtonNotification } from 'trezor-ui-components';
            ~~~
            `,
        },
    });
