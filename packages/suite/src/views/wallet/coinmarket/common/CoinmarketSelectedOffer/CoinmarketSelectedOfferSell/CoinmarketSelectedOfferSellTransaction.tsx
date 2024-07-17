import styled from 'styled-components';
import { Translation, AccountLabeling } from 'src/components/suite';
import { Button, Spinner } from '@trezor/components';
import { useCoinmarketWatchTrade } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import { CoinmarketTradeSellType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { fontWeights, spacingsPx, typography } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: ${spacingsPx.sm};
`;

const WaitingWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px ${spacingsPx.lg};
    flex-direction: column;
`;

const LabelText = styled.div`
    ${typography.label}
    color: ${({ theme }) => theme.textSubdued};
`;

const Value = styled.div`
    ${typography.body}
    color: ${({ theme }) => theme.textDefault};
`;

const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: ${spacingsPx.lg};
    border-top: 1px solid ${({ theme }) => theme.borderElevation1};
    margin: ${spacingsPx.lg} 0;
`;

const Row = styled.div`
    margin: ${spacingsPx.xl};
`;

const Address = styled.div``;

const StyledButton = styled(Button)`
    display: flex;
    min-width: 200px;
`;

const Title = styled.div`
    margin-top: ${spacingsPx.xl};
    font-weight: ${fontWeights.semiBold};
`;

const CoinmarketSelectedOfferSellTransaction = () => {
    const { account, callInProgress, selectedQuote, sellInfo, sendTransaction, trade } =
        useCoinmarketFormContext<CoinmarketTradeSellType>();
    useCoinmarketWatchTrade({
        account,
        trade,
    });
    const t = trade?.data || selectedQuote;

    if (!t || !t.exchange) return null;

    const {
        exchange,
        destinationAddress,
        destinationPaymentExtraId,
        destinationPaymentExtraIdDescription,
        status,
    } = t;
    const providerName = sellInfo?.providerInfos[exchange]?.companyName || exchange;

    return (
        <Wrapper>
            {status === 'SEND_CRYPTO' && destinationAddress ? (
                <>
                    <Row>
                        <LabelText>
                            <Translation id="TR_SELL_SEND_FROM" />
                        </LabelText>
                        <Value>
                            <AccountLabeling account={account} />
                        </Value>
                    </Row>
                    <Row>
                        <LabelText>
                            <Translation id="TR_SELL_SEND_TO" values={{ providerName }} />
                        </LabelText>
                        <Value>
                            <Address>{destinationAddress}</Address>
                        </Value>
                    </Row>
                    {destinationPaymentExtraId && (
                        <Row>
                            <LabelText>
                                {destinationPaymentExtraIdDescription?.name ? (
                                    <Translation
                                        id="TR_SELL_EXTRA_FIELD"
                                        values={{
                                            extraFieldName:
                                                destinationPaymentExtraIdDescription.name,
                                        }}
                                    />
                                ) : (
                                    <Translation id="DESTINATION_TAG" />
                                )}
                            </LabelText>
                            <Value>
                                <Address>{destinationPaymentExtraId}</Address>
                            </Value>
                        </Row>
                    )}

                    <ButtonWrapper>
                        <StyledButton isLoading={callInProgress} onClick={sendTransaction}>
                            <Translation id="TR_SELL_CONFIRM_ON_TREZOR_SEND" />
                        </StyledButton>
                    </ButtonWrapper>
                </>
            ) : (
                <WaitingWrapper>
                    <Spinner />
                    <Title>
                        <Translation
                            id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO"
                            values={{ providerName }}
                        />
                    </Title>
                    <Value>
                        <Translation
                            id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO_INFO"
                            values={{ providerName }}
                        />
                    </Value>
                </WaitingWrapper>
            )}
        </Wrapper>
    );
};

export default CoinmarketSelectedOfferSellTransaction;
