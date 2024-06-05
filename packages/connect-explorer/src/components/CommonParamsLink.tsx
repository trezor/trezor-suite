import Link from 'next/link';
import styled from 'styled-components';

const Floating = styled.div`
    float: right;
    margin-top: -2rem;
`;

const StyledLink = styled(Link)`
    color: ${({ theme }) => theme.textPrimaryDefault};
    text-decoration: underline;
`;

export const CommonParamsLink = () => {
    return (
        <Floating>
            Including <StyledLink href="/details/commonParams">CommonParams</StyledLink>
        </Floating>
    );
};
