import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { INVITY_URL } from '@trezor/urls';
import { variables, Link, Image } from '@trezor/components';
import { CoinmarketFooterLogoWrapper } from 'src/views/wallet/coinmarket';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

export const CoinmarketProvidedByInvity = () => (
    <Wrapper>
        <Translation id="TR_BUY_PROVIDED_BY_INVITY" />
        <CoinmarketFooterLogoWrapper>
            <Link href={INVITY_URL} target="_blank">
                <Image width={70} image="INVITY_LOGO" />
            </Link>
        </CoinmarketFooterLogoWrapper>
    </Wrapper>
);
