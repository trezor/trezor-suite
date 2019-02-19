import Icon from 'components/Icon';
import React from 'react';
import icons from 'config/icons';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import { withInfo } from '@storybook/addon-info';
import {
    withKnobs, number, select, color,
} from '@storybook/addon-knobs';

import colors from 'config/colors';

const Wrapper = styled.div``;

Wrapper.displayName = 'Wrapper';

storiesOf('Other', module)
    .addDecorator(withKnobs)
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
        }),
    )
    .add('Icons', () => (
        <Icon
            icon={select('Icon', {
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
            }, icons.TOP)}
            size={number('Size', 36)}
            hoverColor={color('Hover color', colors.GREEN_PRIMARY)}
        />
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { Icon, icons } from 'trezor-ui-components';
            ~~~

            Example
            ~~~js
            <Icon icon={icons.TOP} />
            ~~~
            `,
        },
    });
