import styled from 'styled-components';
import { Link } from 'react-router-dom';
import Devices from './Devices';

const HeaderComponent = styled.header`
    position: fixed;
    top: 0;
    width: 100%;
    background: #060606;
    color: #f6f7f8;
    overflow: hidden;
    z-index: 100;
    display: flex;
    flex-direction: column;
`;

const HeaderPrimary = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px;

    @media (min-width: 640px) {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 4px 20px;
    }
`;

const Svg = styled.svg`
    fill: #fff;
    height: 28px;
    width: 100px;
    margin-top: 9px;
    display: inline-block;
`;

const HeaderItemsPrimary = styled.div`
    justify-content: center;
    align-items: center;
`;
const HeaderItemsSecondary = styled.div``;

const Title = styled.span`
    display: inline-block;
    vertical-align: top;
    margin-top: 16px;
    margin-left: 20px;
`;

const StyledLink = styled(Link)`
    color: #fff;
    text-decoration: underline;
`;

const Header = () => (
    <HeaderComponent>
        <HeaderPrimary>
            <HeaderItemsPrimary>
                <a href="#/">
                    <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 161.768 40.771">
                        <path d="M24.306 9.461C24.306 4.29 19.761 0 14.228 0 8.694 0 4.148 4.292 4.148 9.46v3.025H0v21.75l14.225 6.536 14.233-6.534V12.581H24.31l-.003-3.121Zm-15.02 0c0-2.438 2.175-4.389 4.942-4.389 2.767 0 4.94 1.951 4.94 4.389v3.024H9.287V9.461Zm13.44 21.264-8.502 3.904-8.499-3.901V17.655h17v13.07z" />
                        <path d="M40.019 12.485h17.886v5.17h-6.127v16.678h-5.731V17.655h-6.028ZM78.46 19.8c0-4.39-3.064-7.218-7.609-7.218H60.474v21.75h5.732v-7.314h2.174l4.051 7.314h6.627l-4.842-8.094c2.07-.78 4.244-2.83 4.244-6.438zm-8.296 2.146h-3.958v-4.39h3.953c1.482 0 2.47.879 2.47 2.147 0 1.365-.988 2.243-2.47 2.243zm10.963-9.461h16.009v5.072H86.858v3.219h9.982v4.974h-9.982v3.51h10.278v5.073H81.127Zm48.125-.294c-6.719 0-11.46 4.78-11.46 11.218 0 6.437 4.839 11.22 11.46 11.22s11.562-4.779 11.562-11.217c0-6.438-4.842-11.22-11.562-11.22zm0 17.363c-3.359 0-5.633-2.536-5.633-6.14 0-3.707 2.274-6.142 5.633-6.142 3.36 0 5.732 2.537 5.732 6.141 0 3.605-2.372 6.14-5.732 6.14zm27.67-3.316c2.074-.78 4.25-2.83 4.25-6.438 0-4.39-3.064-7.218-7.61-7.218h-10.375v21.75h5.731v-7.314h2.178l4.051 7.314h6.621zm-4.052-4.292h-3.952v-4.39h3.952c1.484 0 2.471.879 2.471 2.147 0 1.365-.987 2.243-2.471 2.243zm-52.967-9.461h16.898v4.389l-9.19 12.29h9.19v5.169H99.903v-4.39l9.19-12.288h-9.19z" />
                    </Svg>
                </a>
                <Title>@trezor/connect</Title>
            </HeaderItemsPrimary>
            <HeaderItemsSecondary>
                <StyledLink to="/">quick start</StyledLink>&nbsp;
                <StyledLink to="/events">events</StyledLink>&nbsp;
                <StyledLink to="/changelog">changelog</StyledLink>&nbsp;
            </HeaderItemsSecondary>
        </HeaderPrimary>
        <Devices />
    </HeaderComponent>
);

export default Header;
