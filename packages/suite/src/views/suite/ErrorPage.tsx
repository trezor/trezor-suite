import styled from 'styled-components';

import { H2, Image, Link, NewButton, Paragraph } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';

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
            <Link variant="nostyle" target="_self" href={link}>
                <NewButton>
                    <Translation id="TR_404_GO_TO_DASHBOARD" />
                </NewButton>
            </Link>
        </Wrapper>
    );
};
