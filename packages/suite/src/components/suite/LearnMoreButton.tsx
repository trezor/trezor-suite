import { ReactNode } from 'react';
import styled from 'styled-components';

import { Button, ButtonProps } from '@trezor/components';

import { Translation, TrezorLink } from 'src/components/suite';
import { Url } from '@trezor/urls';

const StyledTrezorLink = styled(TrezorLink)`
    /* Prevents the link from overflowing the button in a flex container so that it cannot be open by clicking next to it */
    width: fit-content;
`;

interface LearnMoreButtonProps extends Omit<ButtonProps, 'children'> {
    url: Url;
    children?: ReactNode;
}

export const LearnMoreButton = ({
    children,
    url,
    className,
    ...buttonProps
}: LearnMoreButtonProps) => (
    <StyledTrezorLink variant="nostyle" href={url} className={className}>
        <Button
            variant="tertiary"
            size="tiny"
            icon="EXTERNAL_LINK"
            iconAlignment="right"
            {...buttonProps}
        >
            {children || <Translation id="TR_LEARN_MORE" />}
        </Button>
    </StyledTrezorLink>
);
