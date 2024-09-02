import styled from 'styled-components';
import { analytics, EventType } from '@trezor/suite-analytics';

import { variables, H2, Button, Card, Image, Column } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { goto } from 'src/actions/suite/routerActions';
import { spacings, spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Title = styled(H2)`
    text-align: center;
    font-weight: 600;
`;

const Description = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: 500;
    text-align: center;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledImage = styled(Image)`
    width: auto;
    height: 80px;
    margin-top: 60px;
    margin-bottom: 28px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    margin-bottom: ${spacingsPx.lg};
    flex-flow: row wrap;
    gap: ${spacingsPx.md};
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${({ theme }) => theme.legacy.STROKE_GREY};
    margin: 30px 0 36px;
`;

interface AccountEmptyProps {
    account: Account;
}

export const AccountEmpty = ({ account }: AccountEmptyProps) => {
    const dispatch = useDispatch();
    const networkSymbol = account.symbol.toUpperCase();

    const handleNavigateToReceivePage = () => {
        dispatch(goto('wallet-receive', { preserveParams: true }));
        analytics.report({
            type: EventType.AccountsEmptyAccountReceive,
            payload: {
                symbol: networkSymbol.toLowerCase(),
            },
        });
    };
    const handleNavigateToBuyPage = () => {
        dispatch(goto('wallet-coinmarket-buy', { preserveParams: true }));

        analytics.report({
            type: EventType.AccountsEmptyAccountBuy,
            payload: {
                symbol: networkSymbol.toLowerCase(),
            },
        });
    };

    return (
        <Wrapper>
            <Card width="100%">
                <Column alignItems="center">
                    <StyledImage image="CLOUDY" />

                    <Title margin={{ bottom: spacings.md }}>
                        <Translation id="TR_ACCOUNT_IS_EMPTY_TITLE" />
                    </Title>

                    <Description>
                        <Translation
                            id="TR_ACCOUNT_IS_EMPTY_DESCRIPTION"
                            values={{ network: networkSymbol }}
                        />
                    </Description>

                    <Divider />

                    <Actions>
                        <Button
                            data-testid="@accounts/empty-account/receive"
                            variant="primary"
                            onClick={handleNavigateToReceivePage}
                            minWidth={160}
                        >
                            <Translation
                                id="TR_RECEIVE_NETWORK"
                                values={{ network: networkSymbol }}
                            />
                        </Button>

                        <Button
                            data-testid="@accounts/empty-account/buy"
                            variant="primary"
                            onClick={handleNavigateToBuyPage}
                            minWidth={160}
                        >
                            <Translation id="TR_BUY_NETWORK" values={{ network: networkSymbol }} />
                        </Button>
                    </Actions>
                </Column>
            </Card>
        </Wrapper>
    );
};
