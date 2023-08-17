import { MouseEventHandler } from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';
import { Translation, TrezorLink } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
    gap: 8px;
`;

const StyledButton = styled(Button)`
    padding-bottom: 0;
    padding-top: 0;
`;

interface InputErrorProps {
    button?: { onClick: MouseEventHandler<HTMLButtonElement>; text: string } | { url: string };
    message?: string;
}

export const InputError = ({ button, message }: InputErrorProps) => (
    <Wrapper>
        {message}
        {button &&
            ('url' in button ? (
                <TrezorLink variant="nostyle" href={button.url}>
                    <StyledButton variant="tertiary" icon="EXTERNAL_LINK" iconAlignment="right">
                        <Translation id="TR_LEARN_MORE" />
                    </StyledButton>
                </TrezorLink>
            ) : (
                <StyledButton variant="tertiary" onClick={button.onClick}>
                    {button.text}
                </StyledButton>
            ))}
    </Wrapper>
);
