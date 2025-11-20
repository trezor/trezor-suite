import styled from 'styled-components';

import { Image, Link } from '@trezor/components';
import { typography } from '@trezor/theme';
import { INVITY_URL } from '@trezor/urls';

import { Translation } from 'src/components/suite/Translation';
import { TradingFooterLogoWrapper } from 'src/views/wallet/trading';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    ${typography.body}
    color: ${({ theme }) => theme.textSubdued};
`;

export const TradingProvidedByInvity = () => (
    <Wrapper>
        <Translation id="TR_BUY_PROVIDED_BY_INVITY" />
        <TradingFooterLogoWrapper>
            <Link href={INVITY_URL} target="_blank">
                <Image width={70} image="INVITY_LOGO" />
            </Link>
        </TradingFooterLogoWrapper>
    </Wrapper>
);
