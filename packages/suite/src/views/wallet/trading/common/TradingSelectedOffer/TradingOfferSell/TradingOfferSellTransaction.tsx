import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Column, Spinner, Text } from '@trezor/components';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { spacings, spacingsPx, typography } from '@trezor/theme';

import { AccountLabeling } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';
import { useAnalytics } from 'src/support/useAnalytics';
import { useTradingSellFormContext } from 'src/views/wallet/trading/sell/TradingSellContext';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: ${spacingsPx.sm};
`;

const LabelText = styled.div`
    ${typography['body-xs']}
    color: ${({ theme }) => theme.textSubdued};
`;

const Value = styled.div`
    ${typography['body-md']}
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

export const TradingSelectedOfferSellTransaction = () => {
    const analytics = useAnalytics();
    const { handleClick, disabled } = useAsyncClickHandler();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const {
        device,
        account,
        form: {
            state: { isFormLoading },
        },
        selectedQuote,
        sellInfo,
        sendTransaction,
        trade,
    } = useTradingSellFormContext();

    useTradingWatchTrade({
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

    const onConfirmAndSendClick = async () => {
        const result = await sendTransaction();

        analytics.report({
            type: events.tradeSellEvent.name,
            payload: {
                action: result ? 'continue' : 'cancel',
                step: 'confirm-and-send-transaction',
            },
        });
    };

    return (
        <Wrapper>
            {status === 'SEND_CRYPTO' && destinationAddress ? (
                <>
                    <Row>
                        <LabelText>
                            <Translation id="TR_SELL_SEND_FROM" />
                        </LabelText>
                        <Value data-testid="@trading/form/verify/account">
                            <AccountLabeling
                                account={account}
                                showAccountTypeBadge
                                accountTypeBadgeSize="small"
                            />
                        </Value>
                    </Row>
                    <Row>
                        <LabelText>
                            <Translation id="TR_SELL_SEND_TO" values={{ providerName }} />
                        </LabelText>
                        <Value data-testid="@trading/form/verify/address">
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
                            <Value data-testid="@trading/form/verify/extra-id">
                                <Address>{destinationPaymentExtraId}</Address>
                            </Value>
                        </Row>
                    )}

                    <ButtonWrapper>
                        <Button
                            minWidth={200}
                            isLoading={isFormLoading || disabled}
                            isDisabled={!device?.connected || isDiscoveryRunning || disabled}
                            onClick={() => handleClick(() => onConfirmAndSendClick())}
                            data-testid="@trading/offer/confirm-on-trezor-and-send"
                        >
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
                    <Spinner size={40} isDisabled={true} margin={{ bottom: spacings.xl }} />
                    <Text>
                        <Translation
                            id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO"
                            values={{ providerName }}
                        />
                    </Text>
                    <Text intent="neutral" priority="secondary">
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
