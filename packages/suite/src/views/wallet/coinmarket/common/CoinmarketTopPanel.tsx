import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { AccountLabeling } from 'src/components/suite';
import { Icon, variables } from '@trezor/components';
import styled from 'styled-components';
import { Route } from 'src/types/suite';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const Content = styled.div`
    display: flex;
    width: 100%;
    padding: 0 32px;
    min-height: 50px;
    justify-content: space-between;
    align-items: center;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 12px 16px;
    }
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Right = styled.div`
    display: flex;
    flex: 1;

    justify-content: flex-end;
`;

const Back = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    width: 10px;
    margin-right: 12px;
`;

interface CoinmarketTopPanelProps {
    backRoute: Route['name'];
}

export const CoinmarketTopPanel = ({ backRoute }: CoinmarketTopPanelProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const dispatch = useDispatch();

    if (selectedAccount.status !== 'loaded') return null;
    const { account } = selectedAccount;

    const goBack = () => dispatch(goto(backRoute, { params: selectedAccount.params }));

    return (
        <Wrapper>
            <Content>
                <Left>
                    <Back onClick={goBack} data-test="@coinmarket/back">
                        <StyledIcon icon="ARROW_LEFT" />
                        <AccountLabeling account={account} />
                    </Back>
                </Left>
                <Right />
            </Content>
        </Wrapper>
    );
};
