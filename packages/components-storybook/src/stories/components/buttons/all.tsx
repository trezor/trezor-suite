import React from 'react';
import styled, { css } from 'styled-components';
import { Button, ButtonPin, H1, ButtonProps } from '@trezor/components';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 1.6rem;
`;

const Div = styled.div`
    margin: 0 0 3.2rem;
`;

const SnapshotWrapper = styled.div<ButtonWrapperProps>`
    ${props =>
        !props.fullWidth &&
        css`
            flex-direction: row;
            display: inline-flex;
        `}
`;

const ButtonWrapper = styled.div<ButtonWrapperProps>`
    margin: ${props => (props.fullWidth ? '0 0 10px' : '0 10px 0 0')};
    width: ${props => (props.fullWidth ? '100%' : 'auto')};
`;

interface ButtonWrapperProps {
    fullWidth: ButtonProps['fullWidth'];
}

storiesOf('Buttons', module).add(
    'All',
    () => {
        const buttonTypes = [
            // basic
            'button_basic',
            'button_basic_icon',
            'button_basic_loading',
            'button_full_width',
            'button_full_width_right',
            'button_full_width_left',
            'button_full_width_icon',
            'button_full_width_icon_right',
            'button_full_width_icon_left',
            'button_full_width_loading',
            'button_full_width_loading_right',
            'button_full_width_loading_left',
            // inverse
            'button_inverse',
            'button_inverse_icon',
            'button_inverse_loading',
            'button_inverse_full_width',
            'button_inverse_icon_full_width',
            'button_inverse_loading_full_width',
            'button_inverse_full_width_right',
            'button_inverse_icon_full_width_right',
            'button_inverse_loading_full_width_right',
            'button_inverse_full_width_left',
            'button_inverse_icon_full_width_left',
            'button_inverse_loading_full_width_left',
        ];
        const buttonStates = ['transparent', 'disabled'];
        const buttonVariants = [
            'success',
            'info',
            'warning',
            'error',
            'white',
        ] as ButtonProps['variant'][];

        return (
            <Wrapper>
                {buttonTypes.map(type => {
                    const hasIcon = !!type.match(/icon/);
                    const isLoading = !!type.match(/loading/);
                    const isFullWidth = !!type.match(/full_width/);
                    const alignLeft = !!type.match(/left/);
                    const alignRight = !!type.match(/right/);
                    const isInverse = !!type.match(/inverse/);
                    const icon = 'PLUS';
                    const title =
                        type.charAt(0).toUpperCase() +
                        type
                            .slice(1)
                            .split('_')
                            .join(' ');

                    return (
                        <Div>
                            <H1>{title}</H1>
                            <SnapshotWrapper data-test={type} fullWidth={isFullWidth}>
                                {buttonVariants.map(variant => {
                                    return (
                                        <ButtonWrapper fullWidth={isFullWidth}>
                                            <Button
                                                variant={variant}
                                                {...(hasIcon ? { icon } : {})}
                                                {...(isLoading ? { isLoading } : {})}
                                                {...(isFullWidth ? { fullWidth: true } : {})}
                                                {...(alignLeft ? { align: 'left' } : {})}
                                                {...(alignRight ? { align: 'right' } : {})}
                                                {...(isInverse ? { isInverse } : {})}
                                            >
                                                Button
                                            </Button>
                                        </ButtonWrapper>
                                    );
                                })}
                            </SnapshotWrapper>
                            {buttonStates.map(state => {
                                return (
                                    !isInverse && (
                                        <SnapshotWrapper
                                            data-test={`${type}_${state}`}
                                            fullWidth={isFullWidth}
                                        >
                                            <ButtonWrapper fullWidth={isFullWidth}>
                                                <Button
                                                    {...(state === 'transparent'
                                                        ? { isTransparent: true }
                                                        : { isDisabled: true })}
                                                    {...(hasIcon ? { icon } : {})}
                                                    {...(isLoading ? { isLoading } : {})}
                                                    {...(isFullWidth ? { fullWidth: true } : {})}
                                                    {...(alignLeft ? { align: 'left' } : {})}
                                                    {...(alignRight ? { align: 'right' } : {})}
                                                >
                                                    Button
                                                </Button>
                                            </ButtonWrapper>
                                        </SnapshotWrapper>
                                    )
                                );
                            })}
                        </Div>
                    );
                })}
                <Div>
                    <H1>Button Pin</H1>
                    <ButtonPin onClick={() => {}} data-test="button_pin" />
                </Div>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
