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

type ButtonProps = { onClick: MouseEventHandler<HTMLButtonElement>; text: string };
type LinkProps = { url: Url };

export type InputErrorProps = {
    button?: ButtonProps | LinkProps;
    message?: string;
};

export const InputError = ({ button, message }: InputErrorProps) => (
    <Wrapper>
        {message}
        {button &&
            ('url' in button ? (
                <LearnMoreButton url={button.url} />
            ) : (
                <Button size="tiny" variant="tertiary" onClick={button.onClick}>
                    {button.text}
                </Button>
            ))}
    </Wrapper>
);
