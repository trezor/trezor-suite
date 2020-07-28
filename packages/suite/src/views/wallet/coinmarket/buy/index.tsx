import React from 'react';
import styled from 'styled-components';
import { CoinmarketLayout, ProvidedByInvity } from '@wallet-components';
import { useBuyInfo } from '@wallet-hooks/useCoinmarket';
import { Button, Select, Icon, Input, colors, H2 } from '@trezor/components';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 25px;
    flex: 1;
`;

const Top = styled.div`
    display: flex;
    flex: 1;
    justify-content: space-between;
`;

const Footer = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
`;

const Middle = styled.div`
    min-width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-end;
`;

const Label = styled.div``;

const StyledButton = styled(Button)`
    min-width: 200px;
`;

const Controls = styled.div`
    display: flex;
    margin: 25px 0;
    padding: 0 0 20px 0;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const Control = styled.div``;

const BottomContent = styled.div``;

const InvityFooter = styled.div`
    display: flex;
    margin: 20px 0;
    padding: 0 0 20px 0;
    justify-content: flex-end;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
`;

const PreviousTransactions = styled.div``;

const CoinmarketBuy = () => {
    const { buyInfo } = useBuyInfo();

    console.log('buyInfo', buyInfo);

    return (
        <CoinmarketLayout
            bottom={
                <BottomContent>
                    <InvityFooter>
                        <ProvidedByInvity />
                    </InvityFooter>
                    <PreviousTransactions>
                        <H2>Previous Transactions</H2>
                    </PreviousTransactions>
                </BottomContent>
            }
        >
            <Content>
                <Top>
                    <Left>
                        <Input />
                    </Left>
                    <Middle>
                        <Icon size={20} icon="RBF" />
                    </Middle>
                    <Right>
                        <Input />
                    </Right>
                </Top>
                <Controls>
                    <Control>+100</Control>
                    <Control>+1000</Control>
                </Controls>
                <Footer>
                    <Left>
                        <Label>Offers from:</Label>
                        <Select />
                    </Left>
                    <Right>
                        <StyledButton>Show offers</StyledButton>
                    </Right>
                </Footer>
            </Content>
        </CoinmarketLayout>
    );
};

export default CoinmarketBuy;
