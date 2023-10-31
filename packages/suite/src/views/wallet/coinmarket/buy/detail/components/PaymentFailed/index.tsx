import styled from 'styled-components';
import { Button, variables, Link, Image } from '@trezor/components';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite/Translation';
import { goto } from 'src/actions/suite/routerActions';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    flex-direction: column;
`;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 10px;
    max-width: 310px;
    text-align: center;
`;

const StyledLink = styled(Link)`
    margin-bottom: 30px;
`;

const StyledButton = styled(Button)`
    margin-top: 30px;
`;

interface PaymentFailedProps {
    supportUrl?: string;
    account: Account;
}

const PaymentFailed = ({ supportUrl, account }: PaymentFailedProps) => {
    const dispatch = useDispatch();

    const goToBuy = () =>
        dispatch(
            goto('wallet-coinmarket-buy', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    return (
        <Wrapper>
            <Image image="UNI_ERROR" />
            <Title>
                <Translation id="TR_BUY_DETAIL_ERROR_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_BUY_DETAIL_ERROR_TEXT" />
            </Description>
            {supportUrl && (
                <StyledLink href={supportUrl} target="_blank">
                    <Button variant="tertiary">
                        <Translation id="TR_BUY_DETAIL_ERROR_SUPPORT" />
                    </Button>
                </StyledLink>
            )}
            <StyledButton onClick={goToBuy}>
                <Translation id="TR_BUY_DETAIL_ERROR_BUTTON" />
            </StyledButton>
        </Wrapper>
    );
};

export default PaymentFailed;
