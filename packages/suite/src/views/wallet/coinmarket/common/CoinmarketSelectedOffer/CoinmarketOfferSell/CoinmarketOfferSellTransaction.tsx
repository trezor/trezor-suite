import styled from 'styled-components';

import { Button, Column, Spinner, Text } from '@trezor/components';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { Translation, AccountLabeling } from 'src/components/suite';
import { useCoinmarketWatchTrade } from 'src/hooks/wallet/coinmarket/useCoinmarketWatchTrade';
import { CoinmarketTradeSellType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: ${spacingsPx.sm};
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

export const CoinmarketSelectedOfferSellTransaction = () => {
    const { account, callInProgress, selectedQuote, sellInfo, sendTransaction, trade } =
        useCoinmarketFormContext<CoinmarketTradeSellType>();
    useCoinmarketWatchTrade({
        account,
        trade,
    });
    const sellTrade = trade?.data || selectedQuote;

    if (!sellTrade || !sellTrade.exchange) return null;

    const {
        exchange,
        destinationAddress,
        destinationPaymentExtraId,
        destinationPaymentExtraIdDescription,
        status,
    } = sellTrade;
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
                        <Button minWidth={200} isLoading={callInProgress} onClick={sendTransaction}>
                            <Translation id="TR_SELL_CONFIRM_ON_TREZOR_SEND" />
                        </Button>
                    </ButtonWrapper>
                </>
            ) : (
                <Column
                    alignItems="center"
                    justifyContent="center"
                    margin={{ horizontal: spacings.lg, vertical: spacings.xxxxl }}
                >
                    <Spinner margin={{ bottom: spacings.xl }} />
                    <Text>
                        <Translation
                            id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO"
                            values={{ providerName }}
                        />
                    </Text>
                    <Text variant="tertiary">
                        <Translation
                            id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO_INFO"
                            values={{ providerName }}
                        />
                    </Text>
                </Column>
            )}
        </Wrapper>
    );
};
