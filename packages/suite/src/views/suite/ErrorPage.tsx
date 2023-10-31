import styled from 'styled-components';
import { Translation } from 'src/components/suite';

import { Paragraph, H2, Button, Link, Image } from '@trezor/components';

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
            <Paragraph type="label">
                <Translation id="TR_404_DESCRIPTION" />
            </Paragraph>
            <Image image="ERROR_404" />
            <Link variant="nostyle" target="_self" href={link}>
                <Button>
                    <Translation id="TR_404_GO_TO_DASHBOARD" />
                </Button>
            </Link>
        </Wrapper>
    );
};
