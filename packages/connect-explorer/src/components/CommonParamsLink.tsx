import Link from 'next/link';
import styled from 'styled-components';

const Floating = styled.div`
    float: right;
    text-align: right;
    margin-top: -32px;
`;

const StyledLink = styled(Link)`
    color: ${({ theme }) => theme.contentBrand};
    text-decoration: underline;
`;

export const CommonParamsLink = () => (
    <Floating>
        Including <StyledLink href="/details/commonParams">CommonParams</StyledLink>
    </Floating>
);
