import { ReactNode } from 'react';

import { Column, Divider, Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AccountLabeling, Address } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';

import { useReceiveAddressModalControls } from './useReceiveAddressModalControls';
import { useTradingReceiveAddressValues } from './useTradingReceiveAddressValues';

interface TradingReceiveAddressEmptyProps {
    title: ReactNode;
    text: ReactNode;
}

export const TradingReceiveAddressEmpty = ({ title, text }: TradingReceiveAddressEmptyProps) => (
    <Column alignItems="center" gap={spacings.xxs} padding={{ vertical: spacings.md }}>
        <Text typographyStyle="body">{title}</Text>
        <Text typographyStyle="hint" variant="tertiary">
            {text}
        </Text>
    </Column>
);

export const TradingReceiveAddress = () => {
    const { tradingReceiveAddress } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const { receiveAddress, selectedAccountOption } = tradingReceiveAddress;

    const onReceiveAccountClick = () => {
        modalControls.open('accountModal');
    };

    return (
        <Column cursor="pointer">
            <Divider margin={0} />

            <Row
                data-testid="@trading/receive-address-picker"
                alignItems="center"
                justifyContent="space-between"
                onClick={onReceiveAccountClick}
                padding={{
                    vertical: !receiveAddress ? spacings.lg : spacings.sm,
                    horizontal: spacings.lg,
                }}
            >
                <Text typographyStyle="body">
                    <Translation
                        id={
                            selectedAccountOption?.account || !receiveAddress
                                ? 'TR_BUY_RECEIVING_ACCOUNT'
                                : 'TR_BUY_RECEIVING_ADDRESS'
                        }
                    />
                </Text>
                <Row gap={16}>
                    <Column alignItems="flex-end">
                        {selectedAccountOption?.account && receiveAddress ? (
                            <>
                                <AccountLabeling
                                    data-test-id="@trading/selected-receive-account"
                                    account={selectedAccountOption.account}
                                    accountTypeBadgeSize="small"
                                    showAccountTypeBadge
                                />
                                <Address
                                    value={receiveAddress}
                                    typographyStyle="hint"
                                    variant="tertiary"
                                    isTruncated
                                />
                            </>
                        ) : (
                            <>
                                {receiveAddress ? (
                                    <Address
                                        value={receiveAddress}
                                        typographyStyle="hint"
                                        variant="tertiary"
                                        isTruncated
                                    />
                                ) : (
                                    <Text typographyStyle="hint" variant="tertiary">
                                        <Translation id="TR_RECEIVE_ACCOUNT_NOT_SELECTED" />
                                    </Text>
                                )}
                            </>
                        )}
                    </Column>

                    <Icon name="caretRight" size={20} variant="tertiary" />
                </Row>
            </Row>
        </Column>
    );
};
