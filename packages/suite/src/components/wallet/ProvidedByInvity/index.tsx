import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { colors, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const Image = styled.img`
    width: 70px;
`;

const Link = styled.a`
    display: flex;
    flex: 1;
    padding-top: 1px;
    align-items: center;
`;

export default () => (
    <Wrapper>
        Provided by
        <Link href="https://invity.io/">
            <Image src={resolveStaticPath('/images/svg/invity-logo.svg')} />
        </Link>
    </Wrapper>
);
