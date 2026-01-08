import { Translation } from '@suite/intl';
import { Column, Divider, Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AccountLabeling, Address, AddressLabel } from 'src/components/suite';

import { useReceiveAddressModalControls } from './useReceiveAddressModalControls';
import { useTradingReceiveAddressValues } from './useTradingReceiveAddressValues';

type TradingReceiveAddressEmptyProps = {
    title: React.ReactNode;
    text: React.ReactNode;
};

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

    const { receiveAddress, selectedAccount } = tradingReceiveAddress;

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
                    vertical: !receiveAddress ? 20 : 12,
                    horizontal: 16,
                }}
            >
                <Text typographyStyle="body">
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
                                <AccountLabeling
                                    data-test-id="@trading/selected-receive-account"
                                    account={selectedAccount}
                                    accountTypeBadgeSize="small"
                                    showAccountTypeBadge
                                />
                                <AddressLabel
                                    typographyStyle="hint"
                                    variant="tertiary"
                                    account={selectedAccount}
                                    address={receiveAddress}
                                />
                            </>
                        ) : (
                            <>
                                {receiveAddress ? (
                                    <Address
                                        value={receiveAddress}
                                        isTruncated
                                        typographyStyle="body"
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
