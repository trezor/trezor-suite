import Link from 'next/link';
import styled from 'styled-components';

const Floating = styled.div`
    float: right;
    text-align: right;
    margin-top: -2rem;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
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
