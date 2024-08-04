import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { StoryColumn } from '../../../support/Story';
import { AssetLogo, CoinType } from './AssetLogo';
import { variables } from '../../../config';

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

const meta: Meta = {
    title: 'Assets/AssetLogos',
} as Meta;
export default meta;

export const All: StoryObj = {
    render: () => (
        <StoryColumn minWidth={700}>
            <WrapperIcons>
                {variables.COINS.map((coin: CoinType) => (
                    <Icon key={coin}>
                        <CoinName>{coin}</CoinName>
                        <AssetLogo symbol={coin} data-test={`coin-${coin}`} size={48} />
                    </Icon>
                ))}
            </WrapperIcons>
        </StoryColumn>
    ),
};
