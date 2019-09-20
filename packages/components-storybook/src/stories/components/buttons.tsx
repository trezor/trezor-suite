import React from 'react';
import styled from 'styled-components';
import { Button, ButtonPin, H1, H5, variables } from '@trezor/components';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../support/info';

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

const { ICONS } = variables;

storiesOf('Buttons', module).add(
    'All',
    () => (
        <Wrapper>
            <H1>Basic </H1>
            <Row>
                <Button variant="success" data-test="button_basic_success">
                    Button
                </Button>
                <Button variant="info" data-test="button_basic_info">
                    Button
                </Button>
                <Button variant="warning" data-test="button_basic_warning">
                    Button
                </Button>
                <Button variant="error" data-test="button_basic_error">
                    Button
                </Button>
            </Row>
            <Row>
                <Button data-test="button_basic_white" isWhite>
                    White
                </Button>
                <Button data-test="button_basic_transparent" isTransparent>
                    Transparent
                </Button>
                <Button data-test="button_basic_disabled" isDisabled>
                    Disabled
                </Button>
            </Row>

            <H5>with an icon</H5>
            <Row>
                <Button icon="PLUS" variant="success" data-test="button_icon_success">
                    Button
                </Button>
                <Button icon="PLUS" variant="info" data-test="button_icon_info">
                    Button
                </Button>
                <Button icon="PLUS" variant="warning" data-test="button_icon_warning">
                    Button
                </Button>
                <Button icon="PLUS" variant="error" data-test="button_icon_error">
                    Button
                </Button>
            </Row>
            <Row>
                <Button icon="PLUS" isWhite data-test="button_icon_white">
                    White
                </Button>
                <Button icon="PLUS" isTransparent data-test="button_icon_transparent">
                    Transparent
                </Button>
                <Button icon="PLUS" isDisabled data-test="button_icon_disabled">
                    Disabled
                </Button>
            </Row>

            <H5>with loading </H5>
            <Row>
                <Button isLoading variant="success" data-test="button_loading_success">
                    Button
                </Button>
                <Button isLoading variant="info" data-test="button_loading_info">
                    Button
                </Button>
                <Button isLoading variant="warning" data-test="button_loading_warning">
                    Button
                </Button>
                <Button isLoading variant="error" data-test="button_loading_error">
                    Button
                </Button>
            </Row>
            <Row>
                <Button isLoading isWhite data-test="button_loading_white">
                    White
                </Button>
                <Button isLoading isTransparent data-test="button_loading_transparent">
                    Transparent
                </Button>
                <Button isLoading isDisabled data-test="button_loading_disabled">
                    Disabled
                </Button>
            </Row>

            <H1>Inverse </H1>
            <Row>
                <Button isInverse variant="success" data-test="button_inverse_success">
                    Button
                </Button>
                <Button isInverse variant="info" data-test="button_inverse_info">
                    Button
                </Button>
                <Button isInverse variant="warning" data-test="button_inverse_warning">
                    Button
                </Button>
                <Button isInverse variant="error" data-test="button_inverse_error">
                    Button
                </Button>
            </Row>
            <Row>
                <Button isInverse isWhite data-test="button_inverse_white">
                    White
                </Button>
                <Button isInverse isTransparent data-test="button_inverse_transparent">
                    Transparent
                </Button>
                <Button isInverse isDisabled data-test="button_inverse_disabled">
                    Disabled
                </Button>
            </Row>

            <H5>with an icon </H5>
            <Row>
                <Button
                    isInverse
                    icon="PLUS"
                    variant="success"
                    data-test="button_inverse_icon_success"
                >
                    Button
                </Button>
                <Button isInverse icon="PLUS" variant="info" data-test="button_inverse_icon_info">
                    Button
                </Button>
                <Button
                    isInverse
                    icon="PLUS"
                    variant="warning"
                    data-test="button_inverse_icon_warning"
                >
                    Button
                </Button>
                <Button isInverse icon="PLUS" variant="error" data-test="button_inverse_icon_error">
                    Button
                </Button>
            </Row>
            <Row>
                <Button isInverse icon="PLUS" isWhite data-test="button_inverse_icon_white">
                    White
                </Button>
                <Button
                    isInverse
                    icon="PLUS"
                    isTransparent
                    data-test="button_inverse_icon_transparent"
                >
                    Transparent
                </Button>
                <Button isInverse icon="PLUS" isDisabled data-test="button_inverse_icon_disabled">
                    Disabled
                </Button>
            </Row>

            <H5>with loading </H5>
            <Row>
                <Button
                    isInverse
                    isLoading
                    variant="success"
                    data-test="button_inverse_loading_success"
                >
                    Button
                </Button>
                <Button isInverse isLoading variant="info" data-test="button_inverse_loading_info">
                    Button
                </Button>
                <Button
                    isInverse
                    isLoading
                    variant="warning"
                    data-test="button_inverse_loading_warning"
                >
                    Button
                </Button>
                <Button
                    isInverse
                    isLoading
                    variant="error"
                    data-test="button_inverse_loading_error"
                >
                    Button
                </Button>
            </Row>
            <Row>
                <Button isInverse isLoading isWhite data-test="button_inverse_loading_white">
                    White
                </Button>
                <Button
                    isInverse
                    isLoading
                    isTransparent
                    data-test="button_inverse_loading_transparent"
                >
                    Transparent
                </Button>
                <Button isInverse isLoading isDisabled data-test="button_inverse_loading_disabled">
                    Disabled
                </Button>
            </Row>
            <H1>Pin</H1>
            <Row>
                <ButtonPin onClick={() => {}} />
            </Row>
        </Wrapper>
    ),
    {
        info: {
            disable: true,
        },
    }
);

storiesOf('Buttons', module)
    .add(
        'Button',
        () => {
            const isInverse = boolean('Inverse', false);
            const isDisabled = boolean('Disabled', false);
            const isLoading = boolean('Loading', false);
            const buttonText = text('Text', 'Button Text');
            const variant: any = select(
                'Variant',
                {
                    Default: null,
                    info: 'info',
                    warning: 'warning',
                    error: 'error',
                },
                null
            );
            const iconOptions: any = {
                None: null,
            };

            ICONS.forEach((icon: string) => {
                iconOptions[icon] = icon;
            });

            const icon = select('Icon', iconOptions, null);
            const isTransparent = boolean('Transparent', false);
            const isWhite = boolean('White', false);
            const fullWidth = boolean('FullWidth', false);

            let textAlign;
            if (fullWidth) {
                textAlign = select(
                    'textAlign',
                    {
                        Center: null,
                        Left: 'left',
                        Right: 'right',
                    },
                    null
                );
            }

            return (
                <Button
                    {...(isDisabled ? { isDisabled } : {})}
                    {...(variant ? { variant } : {})}
                    {...(isTransparent ? { isTransparent } : {})}
                    {...(isWhite ? { isWhite } : {})}
                    {...(isInverse ? { isInverse } : {})}
                    {...(icon ? { icon } : {})}
                    {...(isLoading ? { isLoading } : {})}
                    {...(fullWidth ? { fullWidth } : {})}
                    {...(fullWidth && textAlign ? { textAlign } : {})}
                >
                    {buttonText}
                </Button>
            );
        },
        {
            info: {
                ...infoOptions,
                text: `
            ~~~js
            import { Button } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add('Button Pin', () => <ButtonPin onClick={() => {}} />, {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { ButtonPin } from 'trezor-ui-components';
            ~~~
            `,
        },
    });
