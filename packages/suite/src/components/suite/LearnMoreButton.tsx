import { ReactNode } from 'react';
import styled from 'styled-components';

import { Button } from '@trezor/components';

import { Translation, TrezorLink } from 'src/components/suite';
import { Url } from '@trezor/urls';

const StyledTrezorLink = styled(TrezorLink)`
    /* Prevents the link from overflowing the button in a flex container so that it cannot be open by clicking next to it */
    width: fit-content;
`;

interface LearnMoreButtonProps {
    children?: ReactNode;
    url: Url;
}

export const LearnMoreButton = ({ children, url }: LearnMoreButtonProps) => (
    <StyledTrezorLink variant="nostyle" href={url}>
        <Button variant="tertiary" size="tiny" icon="EXTERNAL_LINK" iconAlignment="right">
            {children || <Translation id="TR_LEARN_MORE" />}
        </Button>
    </StyledTrezorLink>
);
