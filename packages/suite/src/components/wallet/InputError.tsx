import { MouseEventHandler } from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';
import { LearnMoreButton } from '../suite/LearnMoreButton';
import { Url } from '@trezor/urls';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

interface InputErrorProps {
    button?: { onClick: MouseEventHandler<HTMLButtonElement>; text: string } | { url: Url };
    message?: string;
}

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
