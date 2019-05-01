import React from 'react';
import styled from 'styled-components';
import Button from 'components/buttons/Button';
import ButtonPin from 'components/buttons/Pin';
import { H1, H5 } from 'components/Heading';
import { storiesOf } from '@storybook/react';
import { withKnobs, text, boolean, select } from '@storybook/addon-knobs';
import { withInfo } from '@storybook/addon-info';
import { linkTo } from '@storybook/addon-links';

import colors from 'config/colors';
import icons from 'config/icons';

const Wrapper = styled.div`
    padding: 1.6rem;
`;

const Row = styled.div`
    display: flex;
    margin: 0.5rem 0 2rem;
    flex-wrap: wrap;

    button {
        margin: 10px 10px;
    }
`;

const BtnLink = styled.button`
    font-size: 1rem;
    color: ${colors.TEXT_SECONDARY};
    vertical-align: middle;
    background: ${colors.LANDING};
    padding: 0.5rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        color: ${colors.TEXT};
    }
`;

storiesOf('Buttons', module).add('All', () => (
    <Wrapper>
        <H1>
            Basic <BtnLink onClick={linkTo('Buttons', 'Button')}>{'<Button />'}</BtnLink>
        </H1>
        <Row>
            <Button variant="success" data-test="Button__default">
                Button
            </Button>
            <Button variant="info">Button</Button>
            <Button variant="warning">Button</Button>
            <Button variant="error">Button</Button>
        </Row>
        <Row>
            <Button data-test="Button__white" isWhite>
                White
            </Button>
            <Button data-test="Button__transparent" isTransparent>
                Transparent
            </Button>
            <Button data-test="Button__disabled" isDisabled>
                Disabled
            </Button>
        </Row>

        <H5>
            with an icon{' '}
            <BtnLink onClick={linkTo('Buttons', 'Button')}>{'<Button icon="PLUS" />'}</BtnLink>
        </H5>
        <Row>
            <Button icon="PLUS" variant="success">
                Button
            </Button>
            <Button icon="PLUS" variant="info">
                Button
            </Button>
            <Button icon="PLUS" variant="warning">
                Button
            </Button>
            <Button icon="PLUS" variant="error">
                Button
            </Button>
        </Row>
        <Row>
            <Button icon="PLUS" isWhite>
                White
            </Button>
            <Button icon="PLUS" isTransparent>
                Transparent
            </Button>
            <Button icon="PLUS" isDisabled>
                Disabled
            </Button>
        </Row>

        <H5>
            with loading{' '}
            <BtnLink onClick={linkTo('Buttons', 'Button')}>{'<Button isLoading />'}</BtnLink>
        </H5>
        <Row>
            <Button isLoading variant="success">
                Button
            </Button>
            <Button isLoading variant="info">
                Button
            </Button>
            <Button isLoading variant="warning">
                Button
            </Button>
            <Button isLoading variant="error">
                Button
            </Button>
        </Row>
        <Row>
            <Button isLoading isWhite>
                White
            </Button>
            <Button isLoading isTransparent>
                Transparent
            </Button>
            <Button isLoading isDisabled>
                Disabled
            </Button>
        </Row>

        <H1>
            Inverse{' '}
            <BtnLink onClick={linkTo('Buttons', 'Button')}>{'<Button isInverse />'}</BtnLink>
        </H1>
        <Row>
            <Button isInverse variant="success">
                Button
            </Button>
            <Button isInverse variant="info">
                Button
            </Button>
            <Button isInverse variant="warning">
                Button
            </Button>
            <Button isInverse variant="error">
                Button
            </Button>
        </Row>
        <Row>
            <Button isInverse isWhite>
                White
            </Button>
            <Button isInverse isTransparent>
                Transparent
            </Button>
            <Button isInverse isDisabled>
                Disabled
            </Button>
        </Row>

        <H5>
            with an icon{' '}
            <BtnLink onClick={linkTo('Buttons', 'Button')}>
                {'<Button isInverse icon="PLUS" />'}
            </BtnLink>
        </H5>
        <Row>
            <Button isInverse icon="PLUS" variant="success">
                Button
            </Button>
            <Button isInverse icon="PLUS" variant="info">
                Button
            </Button>
            <Button isInverse icon="PLUS" variant="warning">
                Button
            </Button>
            <Button isInverse icon="PLUS" variant="error">
                Button
            </Button>
        </Row>
        <Row>
            <Button isInverse icon="PLUS" isWhite>
                White
            </Button>
            <Button isInverse icon="PLUS" isTransparent>
                Transparent
            </Button>
            <Button isInverse icon="PLUS" isDisabled>
                Disabled
            </Button>
        </Row>

        <H5>
            with loading{' '}
            <BtnLink onClick={linkTo('Buttons', 'Button')}>
                {'<Button isInverse isLoading />'}
            </BtnLink>
        </H5>
        <Row>
            <Button isInverse isLoading variant="success">
                Button
            </Button>
            <Button isInverse isLoading variant="info">
                Button
            </Button>
            <Button isInverse isLoading variant="warning">
                Button
            </Button>
            <Button isInverse isLoading variant="error">
                Button
            </Button>
        </Row>
        <Row>
            <Button isInverse isLoading isWhite>
                White
            </Button>
            <Button isInverse isLoading isTransparent>
                Transparent
            </Button>
            <Button isInverse isLoading isDisabled>
                Disabled
            </Button>
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
        })
    )
    .addDecorator(withKnobs)
    .add(
        'Button',
        () => {
            const isInverse = boolean('Inverse', false);
            const isDisabled = boolean('Disabled', false);
            const isLoading = boolean('Loading', false);
            const buttonText = text('Text', 'Button Text');
            const variant = select(
                'Variant',
                {
                    None: null,
                    info: 'info',
                    success: 'success',
                    warning: 'warning',
                    error: 'error',
                },
                'success'
            );
            const icon = select(
                'Icon',
                { None: null, ...Object.fromEntries(Object.keys(icons).map(key => [key, key])) },
                null
            );

            const isTransparent = boolean('Transparent', false);
            const isWhite = boolean('White', false);

            return (
                <Button
                    {...(isDisabled ? { isDisabled } : {})}
                    {...(variant ? { variant } : {})}
                    {...(isTransparent ? { isTransparent } : {})}
                    {...(isWhite ? { isWhite } : {})}
                    {...(isInverse ? { isInverse } : {})}
                    {...(icon ? { icon } : {})}
                    {...(isLoading ? { isLoading } : {})}
                >
                    {buttonText}
                </Button>
            );
        },
        {
            info: {
                text: `
            ## Import
            ~~~js
            import { Button } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add('Button Pin', () => <ButtonPin onClick={() => {}} />, {
        info: {
            text: `
            ## Import
            ~~~js
            import { ButtonPin } from 'trezor-ui-components';
            ~~~
            `,
        },
    });
