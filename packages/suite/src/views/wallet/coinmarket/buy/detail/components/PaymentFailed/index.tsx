import * as routerActions from '@suite-actions/routerActions';
import React from 'react';
import styled from 'styled-components';
import { resolveStaticPath } from '@suite-utils/build';
import { Button, variables, Link } from '@trezor/components';
import { useActions } from '@suite-hooks/useActions';
import { Account } from '@wallet-types';
import { Translation } from '@suite-components/Translation';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px 60px 20px;
    flex-direction: column;
`;

const Image = styled.img``;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 10px 0;
    max-width: 310px;
    text-align: center;
`;

const StyledLink = styled(Link)`
    margin-bottom: 30px;
`;

const StyledButton = styled(Button)`
    margin-top: 30px;
`;

interface Props {
    supportUrl?: string;
    account: Account;
}

const PaymentFailed = ({ supportUrl, account }: Props) => {
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    return (
        <Wrapper>
            <Image src={resolveStaticPath('/images/svg/uni-error.svg')} />
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
            <StyledButton
                onClick={() =>
                    goto('wallet-coinmarket-buy', {
                        symbol: account.symbol,
                        accountIndex: account.index,
                        accountType: account.accountType,
                    })
                }
            >
                <Translation id="TR_BUY_DETAIL_ERROR_BUTTON" />
            </StyledButton>
        </Wrapper>
    );
};

export default PaymentFailed;
