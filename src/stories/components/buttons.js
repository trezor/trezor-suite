import React from 'react';
import styled from 'styled-components';
import Button from 'components/buttons/Button';
import ButtonPin from 'components/buttons/Pin';
import ButtonNotification from 'components/buttons/Notification';
import { H1 } from 'components/Heading';
import { storiesOf } from '@storybook/react';
import {
    withKnobs, text, boolean, select,
} from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';
import { linkTo } from '@storybook/addon-links';

import colors from 'config/colors';
import icons from 'config/icons';

const Wrapper = styled.div`
    padding: 1.6rem;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-evenly;
    padding: 1rem 0;
    margin: .5rem 0 2rem;
`;

const BtnLink = styled.button`
    font-size: 1rem;
    color: ${colors.TEXT_SECONDARY};
    vertical-align: middle;
    background: ${colors.LANDING};
    padding: .5rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        color: ${colors.TEXT};
    }
`;

storiesOf('Buttons', module)
    .add('All', () => (
        <Wrapper>
            <H1>
                Default <BtnLink onClick={linkTo('Buttons', 'Button')}>{'<Button />'}</BtnLink>
            </H1>
            <Row>
                <Button>
                    Button
                </Button>
                <Button isWhite>
                    White
                </Button>
                <Button isTransparent>
                    Transparent
                </Button>
                <Button isDisabled>
                    Disabled
                </Button>
            </Row>
            <H1>
                Inverse <BtnLink onClick={linkTo('Buttons', 'Button')}>{'<Button isInverse />'}</BtnLink>
            </H1>
            <Row>
                <Button
                    isInverse
                >
                    Inverse
                </Button>
                <Button
                    isInverse
                    icon={icons.PLUS}
                >
                    Icon
                </Button>
                <Button
                    isInverse
                    icon={icons.PLUS}
                    isDisabled
                >
                    Icon Disabled
                </Button>
            </Row>
            <H1>
                Notification <BtnLink onClick={linkTo('Buttons', 'Button Notification')}>{'<ButtonNotification />'}</BtnLink>
            </H1>
            <Row>
                <ButtonNotification type="success">
                    Confirm!
                </ButtonNotification>
                <ButtonNotification type="info">
                    Info!
                </ButtonNotification>
                <ButtonNotification type="warning">
                    Warning!
                </ButtonNotification>
                <ButtonNotification type="error">
                    Error!
                </ButtonNotification>
            </Row>
            <H1>
                Pin <BtnLink onClick={linkTo('Buttons', 'Button Pin')}>{'<ButtonPin />'}</BtnLink>
            </H1>
            <Row>
                <ButtonPin onClick={() => {}} />
            </Row>
        </Wrapper>
    ));

storiesOf('Buttons', module)
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
        const buttonText = text('Text', 'Button Text');
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
            Info: 'info',
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
