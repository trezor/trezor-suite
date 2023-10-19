import { ReactElement } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 25px;
`;

const Left = styled.div`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const Right = styled.div``;

interface HeaderProps {
    left: ReactElement;
    right?: ReactElement;
}

const Header = ({ left, right }: HeaderProps) => (
    <Wrapper>
        {left && <Left>{left}</Left>}
        {right && <Right>{right}</Right>}
    </Wrapper>
);

export default Header;
