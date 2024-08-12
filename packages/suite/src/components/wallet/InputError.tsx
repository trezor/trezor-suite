import { MouseEventHandler } from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';
import { LearnMoreButton } from '../suite/LearnMoreButton';
import { Url } from '@trezor/urls';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xs};
`;

const ButtonWrapper = styled.div`
    position: absolute;
    top: 4px;
    right: 16px;
`;

const ContentWrapper = styled.div`
    flex-grow: 1;
    padding-right: 150px;
`;

type ButtonProps = { onClick: MouseEventHandler<HTMLButtonElement>; text: string };
type LinkProps = { url: Url };

export type InputErrorProps = {
    button?: ButtonProps | LinkProps;
    message?: string;
};

export const InputError = ({ button, message }: InputErrorProps) => (
    <Wrapper>
        <ContentWrapper>{message}</ContentWrapper>
        {button &&
            ('url' in button ? (
                <LearnMoreButton url={button.url} />
            ) : (
                <ButtonWrapper>
                    <Button size="tiny" variant="tertiary" onClick={button.onClick}>
                        {button.text}
                    </Button>
                </ButtonWrapper>
            ))}
    </Wrapper>
);
