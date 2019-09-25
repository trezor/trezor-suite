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
    'Button',
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
                <Button variant="white" data-test="button_basic_white">
                    Button
                </Button>
            </Row>
            <Row>
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
                <Button icon="PLUS" variant="white" data-test="button_icon_white">
                    Button
                </Button>
            </Row>
            <Row>
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
                <Button isLoading variant="white" data-test="button_loading_white">
                    Button
                </Button>
            </Row>
            <Row>
                <Button isLoading isTransparent data-test="button_loading_transparent">
                    Transparent
                </Button>
                <Button isLoading isDisabled data-test="button_loading_disabled">
                    Disabled
                </Button>
            </Row>

            <H1>Basic - full width </H1>
            <Div>
                <Button fullWidth variant="success" data-test="button_basic_success_full_width">
                    Button
                </Button>
                <Button fullWidth variant="info" data-test="button_basic_info_full_width">
                    Button
                </Button>
                <Button fullWidth variant="warning" data-test="button_basic_warning_full_width">
                    Button
                </Button>
                <Button fullWidth variant="error" data-test="button_basic_error_full_width">
                    Button
                </Button>
                <Button fullWidth variant="white" data-test="button_basic_white_full_width">
                    Button
                </Button>
                <br />
                <Button isTransparent fullWidth data-test="button_basic_transparent_full_width">
                    Transparent
                </Button>
                <Button isDisabled fullWidth data-test="button_basic_disabled_full_width">
                    Disabled
                </Button>
            </Div>

            <H5>with an icon</H5>
            <Div>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="success"
                    data-test="button_icon_success_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="info"
                    data-test="button_icon_info_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="warning"
                    data-test="button_icon_warning_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="error"
                    data-test="button_icon_error_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="white"
                    data-test="button_icon_white_full_width"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    icon="PLUS"
                    isTransparent
                    data-test="button_icon_transparent_full_width"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    isDisabled
                    data-test="button_icon_disabled_full_width"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with loading </H5>
            <Div>
                <Button
                    fullWidth
                    isLoading
                    variant="success"
                    data-test="button_loading_success_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="info"
                    data-test="button_loading_info_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="warning"
                    data-test="button_loading_warning_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="error"
                    data-test="button_loading_error_full_width"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="white"
                    data-test="button_loading_white_full_width"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isLoading
                    isTransparent
                    data-test="button_loading_transparent_full_width"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isLoading
                    isDisabled
                    data-test="button_loading_disabled_full_width"
                >
                    Disabled
                </Button>
            </Div>

            <H1>Basic - right aligned fullwith </H1>
            <Div>
                <Button
                    fullWidth
                    variant="success"
                    data-test="button_basic_success_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    variant="info"
                    data-test="button_basic_info_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    variant="warning"
                    data-test="button_basic_warning_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    variant="error"
                    data-test="button_basic_error_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    variant="white"
                    data-test="button_basic_white_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <br />
                <Button
                    isTransparent
                    fullWidth
                    data-test="button_basic_transparent_full_width_right"
                    align="right"
                >
                    Transparent
                </Button>
                <Button
                    isDisabled
                    fullWidth
                    data-test="button_basic_disabled_full_width_right"
                    align="right"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with an icon</H5>
            <Div>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="success"
                    data-test="button_icon_success_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="info"
                    data-test="button_icon_info_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="warning"
                    data-test="button_icon_warning_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="error"
                    data-test="button_icon_error_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="white"
                    data-test="button_icon_white_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    icon="PLUS"
                    isTransparent
                    data-test="button_icon_transparent_full_width_right"
                    align="right"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    isDisabled
                    data-test="button_icon_disabled_full_width_right"
                    align="right"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with loading </H5>
            <Div>
                <Button
                    fullWidth
                    isLoading
                    variant="success"
                    data-test="button_loading_success_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="info"
                    data-test="button_loading_info_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="warning"
                    data-test="button_loading_warning_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="error"
                    data-test="button_loading_error_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="white"
                    data-test="button_loading_white_full_width_right"
                    align="right"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isLoading
                    isTransparent
                    data-test="button_loading_transparent_full_width_right"
                    align="right"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isLoading
                    isDisabled
                    data-test="button_loading_disabled_full_width_right"
                    align="right"
                >
                    Disabled
                </Button>
            </Div>

            <H5>Basic - full width aligned left</H5>
            <Div>
                <Button
                    fullWidth
                    variant="success"
                    data-test="button_basic_success_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    variant="info"
                    data-test="button_basic_info_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    variant="warning"
                    data-test="button_basic_warning_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    variant="error"
                    data-test="button_basic_error_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    variant="white"
                    data-test="button_basic_white_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <br />
                <Button
                    isTransparent
                    fullWidth
                    data-test="button_basic_transparent_full_width_left"
                    align="left"
                >
                    Transparent
                </Button>
                <Button
                    isDisabled
                    fullWidth
                    data-test="button_basic_disabled_full_width_left"
                    align="left"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with an icon</H5>
            <Div>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="success"
                    data-test="button_icon_success_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="info"
                    data-test="button_icon_info_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="warning"
                    data-test="button_icon_warning_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="error"
                    data-test="button_icon_error_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    variant="white"
                    data-test="button_icon_white_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    icon="PLUS"
                    isTransparent
                    data-test="button_icon_transparent_full_width_left"
                    align="left"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    icon="PLUS"
                    isDisabled
                    data-test="button_icon_disabled_full_width_left"
                    align="left"
                >
                    Disabled
                </Button>
            </Div>

            <H5>with loading </H5>
            <Div>
                <Button
                    fullWidth
                    isLoading
                    variant="success"
                    data-test="button_loading_success_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="info"
                    data-test="button_loading_info_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="warning"
                    data-test="button_loading_warning_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="error"
                    data-test="button_loading_error_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <Button
                    fullWidth
                    isLoading
                    variant="white"
                    data-test="button_loading_white_full_width_left"
                    align="left"
                >
                    Button
                </Button>
                <br />
                <Button
                    fullWidth
                    isLoading
                    isTransparent
                    data-test="button_loading_transparent_full_width_left"
                    align="left"
                >
                    Transparent
                </Button>
                <Button
                    fullWidth
                    isLoading
                    isDisabled
                    data-test="button_loading_disabled_full_width_left"
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
