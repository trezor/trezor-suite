import styled from 'styled-components';
import { CoinLogo, CoinType, variables } from '../../../index';
import { StoryColumn } from '../../../support/Story';

const CoinName = styled.div`
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const WrapperIcons = styled.div`
    display: grid;
    width: 100%;
    grid-gap: 5px;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
`;

const Icon = styled.div`
    display: flex;
    min-height: 100px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

export default {
    title: 'Assets/CoinLogos',
};

export const All = {
    render: () => (
        <StoryColumn minWidth={700}>
            <WrapperIcons>
                {variables.COINS.map((coin: CoinType) => (
                    <Icon>
                        <CoinName>{coin}</CoinName>
                        <CoinLogo symbol={coin} data-test={`coin-${coin}`} size={64} />
                    </Icon>
                ))}
            </WrapperIcons>
        </StoryColumn>
    ),
};
