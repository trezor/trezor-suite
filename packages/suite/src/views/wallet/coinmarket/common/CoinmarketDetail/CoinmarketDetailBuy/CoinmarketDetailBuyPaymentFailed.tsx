import styled from 'styled-components';

import { Button, H4, Image } from '@trezor/components';
import { spacings, typography } from '@trezor/theme';

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

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.body}
    margin: 17px 0 10px;
    max-width: 310px;
    text-align: center;
`;

interface PaymentFailedProps {
    supportUrl?: string;
    account: Account;
}

export const CoinmarketDetailBuyPaymentFailed = ({ supportUrl, account }: PaymentFailedProps) => {
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
            <H4 margin={{ top: spacings.xl }}>
                <Translation id="TR_BUY_DETAIL_ERROR_TITLE" />
            </H4>
            <Description>
                <Translation id="TR_BUY_DETAIL_ERROR_TEXT" />
            </Description>
            {supportUrl && (
                <Button
                    variant="tertiary"
                    href={supportUrl}
                    target="_blank"
                    margin={{ top: spacings.xxl }}
                >
                    <Translation id="TR_BUY_DETAIL_ERROR_SUPPORT" />
                </Button>
            )}
            <Button onClick={goToBuy} margin={{ top: spacings.xxl }}>
                <Translation id="TR_BUY_DETAIL_ERROR_BUTTON" />
            </Button>
        </Wrapper>
    );
};
