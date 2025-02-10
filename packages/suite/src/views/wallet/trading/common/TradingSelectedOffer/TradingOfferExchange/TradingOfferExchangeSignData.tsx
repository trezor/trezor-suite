import styled from 'styled-components';

import type { TradingExchangeType } from '@suite-common/trading';
import { Button, Card, CollapsibleBox, Column, Divider, InfoItem, Text } from '@trezor/components';
import { EthereumSignTypedDataMessage, EthereumSignTypedDataTypes } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { AccountLabeling, Address, Translation } from 'src/components/suite';
import { BannerPoints } from 'src/components/wallet/WalletLayout/AccountBanners/BannerPoints';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';

const Pre = styled.pre`
    text-align: left;
    word-break: break-all;
    white-space: pre-wrap;
`;

export const TradingOfferExchangeSignData = () => {
    const { device, account, callInProgress, selectedQuote, exchangeInfo, signDataAndConfirm } =
        useTradingFormContext<TradingExchangeType>();

    if (!selectedQuote) return null;

    const { exchange, dexTx, receive, send, signData } = selectedQuote;
    if (!exchange || !dexTx || !receive || !send || !signData) return null;

    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    const typedData = signData.data as EthereumSignTypedDataMessage<EthereumSignTypedDataTypes>;

    return (
        <Column gap={spacings.lg} flex="1">
            <InfoItem label={<Translation id="TR_EXCHANGE_SEND_FROM" />}>
                <AccountLabeling account={account} />
            </InfoItem>
            <InfoItem
                label={
                    <Translation
                        id="TR_EXCHANGE_SWAP_SEND_TO"
                        values={{ provider: providerName }}
                    />
                }
            >
                <Address value={dexTx.to} />
            </InfoItem>
            <Card>
                <Text typographyStyle="highlight" as="div" margin={{ bottom: spacings.xs }}>
                    <Translation
                        id="TR_TRADING_EXCHANGE_SIGN_BANNER_TITLE"
                        values={{ provider: providerName }}
                    />
                </Text>
                <BannerPoints
                    points={[
                        <Translation
                            id="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_1"
                            key="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_1"
                        />,
                        <Translation
                            id="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_2"
                            key="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_2"
                        />,
                        <Translation
                            id="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_3"
                            key="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_3"
                        />,
                    ]}
                />
            </Card>
            <CollapsibleBox heading="Typed data to sign">
                <InfoItem label="Domain">
                    <Card paddingType="small">
                        <Column gap={spacings.xs}>
                            {Object.entries(typedData.domain).map(([key, value]) => (
                                <InfoItem key={key} label={key} gap={spacings.zero}>
                                    <Pre>{value.toString()}</Pre>
                                </InfoItem>
                            ))}
                        </Column>
                    </Card>
                </InfoItem>
                <InfoItem label={typedData.primaryType}>
                    <Card paddingType="small">
                        <Column gap={spacings.xs}>
                            {Object.entries(typedData.message).map(([key, value]) => (
                                <InfoItem key={key} label={key} gap={spacings.zero}>
                                    <Pre>{value.toString()}</Pre>
                                </InfoItem>
                            ))}
                        </Column>
                    </Card>
                </InfoItem>
            </CollapsibleBox>
            <Column>
                <Divider margin={{ top: spacings.xs, bottom: spacings.lg }} />
                <Button
                    isLoading={callInProgress}
                    isDisabled={!device?.connected}
                    onClick={signDataAndConfirm}
                >
                    <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                </Button>
            </Column>
        </Column>
    );
};
