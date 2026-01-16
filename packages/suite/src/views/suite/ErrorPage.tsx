import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Button, H2, Image, Paragraph } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    width: 100%;
    flex-direction: column;
`;

export const ErrorPage = () => {
    const link = process.env.ASSET_PREFIX || '/';

    return (
        <Wrapper>
            <H2>
                <Translation id="TR_404_TITLE" />
            </H2>
            <Paragraph typographyStyle="label">
                <Translation id="TR_404_DESCRIPTION" />
            </Paragraph>
            <Image image="ERROR_404" />
            <Button href={link} target="_self">
                <Translation id="TR_404_GO_TO_DASHBOARD" />
            </Button>
        </Wrapper>
    );
};
