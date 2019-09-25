import React from 'react';
import styled from 'styled-components';
import { Button, ButtonPin, H1, H5, variables } from '@trezor/components';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

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

const Div = styled.div`
    margin: 0.5rem 0 2rem;
`;

const { ICONS } = variables;

storiesOf('Buttons', module).add(
    'Inverse',
    () => (
        <Wrapper>
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
                <Button isInverse variant="white" data-test="button_inverse_white">
                    Button
                </Button>
            </Row>
            <Row>
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
                <Button isInverse icon="PLUS" variant="white" data-test="button_inverse_icon_white">
                    Button
                </Button>
            </Row>
            <Row>
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
                <Button
                    isInverse
                    isLoading
                    variant="white"
                    data-test="button_inverse_loading_white"
                >
                    Button
                </Button>
            </Row>
            <Row>
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

            <H1>Inverse - full width </H1>
            <Div>
                <Button
                    fullWidth
                    isInverse
                    variant="success"
                    data-test="button_inverse_success_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="info"
                    data-test="button_inverse_info_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="warning"
                    data-test="button_inverse_warning_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="error"
                    data-test="button_inverse_error_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="white"
                    data-test="button_inverse_white_full_width"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isInverse
                    isTransparent
                    data-test="button_inverse_transparent_full_width"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isDisabled
                    data-test="button_inverse_disabled_full_width"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with an icon</H5>
            <Div>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="success"
                    data-test="button_inverse_icon_success_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="info"
                    data-test="button_inverse_icon_info_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="warning"
                    data-test="button_inverse_icon_warning_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="error"
                    data-test="button_inverse_icon_error_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="white"
                    data-test="button_inverse_icon_white_full_width"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    isTransparent
                    data-test="button_inverse_icon_transparent_full_width"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    isDisabled
                    data-test="button_inverse_icon_disabled_full_width"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with loading </H5>
            <Div>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="success"
                    data-test="button_inverse_loading_success_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="info"
                    data-test="button_inverse_loading_info_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="warning"
                    data-test="button_inverse_loading_warning_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="error"
                    data-test="button_inverse_loading_error_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="white"
                    data-test="button_inverse_loading_white_full_width"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    isTransparent
                    data-test="button_inverse_loading_transparent_full_width"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    isDisabled
                    data-test="button_inverse_loading_disabled_full_width"
                >
                    Disabled
                </Button>
            </Div>

            <H1>Inverse - right aligned full width </H1>
            <Div>
                <Button
                    fullWidth
                    isInverse
                    variant="success"
                    data-test="button_inverse_success_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="info"
                    data-test="button_inverse_info_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="warning"
                    data-test="button_inverse_warning_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="error"
                    data-test="button_inverse_error_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="white"
                    data-test="button_inverse_white_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isInverse
                    isTransparent
                    data-test="button_inverse_transparent_full_width_right"
                    align="right"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isDisabled
                    data-test="button_inverse_disabled_full_width_right"
                    align="right"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with an icon </H5>
            <Div>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="success"
                    data-test="button_inverse_icon_success_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="info"
                    data-test="button_inverse_icon_info_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="warning"
                    data-test="button_inverse_icon_warning_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="error"
                    data-test="button_inverse_icon_error_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="white"
                    data-test="button_inverse_icon_white_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    isTransparent
                    data-test="button_inverse_icon_transparent_full_width_right"
                    align="right"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    isDisabled
                    data-test="button_inverse_icon_disabled_full_width_right"
                    align="right"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with loading </H5>
            <Div>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="success"
                    data-test="button_inverse_loading_success_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="info"
                    data-test="button_inverse_loading_info_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="warning"
                    data-test="button_inverse_loading_warning_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="error"
                    data-test="button_inverse_loading_error_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="white"
                    data-test="button_inverse_loading_white_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    isTransparent
                    data-test="button_inverse_loading_transparent_full_width_right"
                    align="right"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    isDisabled
                    data-test="button_inverse_loading_disabled_full_width_right"
                    align="right"
                >
                    Disabled
                </Button>
            </Div>

            <H1>Inverse - full width aligned left</H1>
            <Div>
                <Button
                    fullWidth
                    isInverse
                    variant="success"
                    data-test="button_inverse_success_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="info"
                    data-test="button_inverse_info_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="warning"
                    data-test="button_inverse_warning_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="error"
                    data-test="button_inverse_error_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    variant="white"
                    data-test="button_inverse_white_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isInverse
                    isTransparent
                    data-test="button_inverse_transparent_full_width_left"
                    align="left"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isDisabled
                    data-test="button_inverse_disabled_full_width_left"
                    align="left"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with an icon </H5>
            <Div>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="success"
                    data-test="button_inverse_icon_success_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="info"
                    data-test="button_inverse_icon_info_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="warning"
                    data-test="button_inverse_icon_warning_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="error"
                    data-test="button_inverse_icon_error_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    variant="white"
                    data-test="button_inverse_icon_white_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    isTransparent
                    data-test="button_inverse_icon_transparent_full_width_left"
                    align="left"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isInverse
                    icon="PLUS"
                    isDisabled
                    data-test="button_inverse_icon_disabled_full_width_left"
                    align="left"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with loading </H5>
            <Div>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="success"
                    data-test="button_inverse_loading_success_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="info"
                    data-test="button_inverse_loading_info_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="warning"
                    data-test="button_inverse_loading_warning_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="error"
                    data-test="button_inverse_loading_error_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    variant="white"
                    data-test="button_inverse_loading_white_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    isTransparent
                    data-test="button_inverse_loading_transparent_full_width_left"
                    align="left"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isInverse
                    isLoading
                    isDisabled
                    data-test="button_inverse_loading_disabled_full_width_left"
                    align="left"
                >
                    Disabled
                </Button>
            </Div>

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

storiesOf('Buttons', module).add(
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
                white: 'white',
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
        const fullWidth = boolean('FullWidth', false);

        let align;
        if (fullWidth) {
            align = select(
                'align',
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
                {...(isInverse ? { isInverse } : {})}
                {...(icon ? { icon } : {})}
                {...(isLoading ? { isLoading } : {})}
                {...(fullWidth ? { fullWidth } : {})}
                {...(fullWidth && align ? { align } : {})}
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
);
