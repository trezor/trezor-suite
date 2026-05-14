import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Column, GhostContainer, Icon, Row, Text } from '@trezor/components';

import { AccountLabeling, Address } from 'src/components/suite';

import { useReceiveAddressModalControls } from './useReceiveAddressModalControls';
import { useTradingReceiveAddressValues } from './useTradingReceiveAddressValues';

interface TradingReceiveAddressEmptyProps {
    title: ReactNode;
    text: ReactNode;
}

export const TradingReceiveAddressEmpty = ({ title, text }: TradingReceiveAddressEmptyProps) => (
    <Column alignItems="center" gap={4} padding={{ vertical: 16 }}>
        <Text typographyStyle="body-md">{title}</Text>
        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
            {text}
        </Text>
    </Column>
);

export const TradingReceiveAddress = () => {
    const { tradingReceiveAddress } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const { receiveAddress, selectedAccount } = tradingReceiveAddress;

    const onReceiveAccountClick = () => {
        modalControls.open('accountModal');
    };

    return (
        <GhostContainer
            onClick={onReceiveAccountClick}
            data-testid="@trading/receive-address-picker"
            cursor="pointer"
            borderRadius={0}
        >
            <Row
                alignItems="center"
                justifyContent="space-between"
                padding={{
                    vertical: selectedAccount && receiveAddress ? 12 : 16,
                    horizontal: 20,
                }}
            >
                <Text typographyStyle="body-md" align="start">
                    <Translation
                        id={
                            selectedAccount || !receiveAddress
                                ? 'TR_BUY_RECEIVING_ACCOUNT'
                                : 'TR_BUY_RECEIVING_ADDRESS'
                        }
                    />
                </Text>
                <Row gap={16}>
                    <Column alignItems="flex-end">
                        {selectedAccount && receiveAddress ? (
                            <>
                                <Text
                                    typographyStyle="body-md"
                                    as="div"
                                    data-testid="@trading/selected-receive-account"
                                    ellipsisLineCount={1}
                                    maxWidth={200}
                                >
                                    <AccountLabeling
                                        account={selectedAccount}
                                        accountTypeBadgeSize="small"
                                        showAccountTypeBadge
                                    />
                                </Text>
                                <Address
                                    value={receiveAddress}
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                    isTruncated
                                />
                            </>
                        ) : (
                            <>
                                {receiveAddress ? (
                                    <Address
                                        value={receiveAddress}
                                        typographyStyle="body-md"
                                        intent="neutral"
                                        isTruncated
                                    />
                                ) : (
                                    <Text
                                        typographyStyle="body-sm"
                                        intent="neutral"
                                        priority="secondary"
                                    >
                                        <Translation id="TR_RECEIVE_ACCOUNT_NOT_SELECTED" />
                                    </Text>
                                )}
                            </>
                        )}
                    </Column>

                    <Icon name="caretRight" size={20} intent="neutral" priority="secondary" />
                </Row>
            </Row>
        </GhostContainer>
    );
};
