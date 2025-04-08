import styled from 'styled-components';

import { parseCryptoId, useTradingInfo } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { Column, Icon, Row, variables } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { AccountLabeling, Translation } from 'src/components/suite';
import { FORM_SEND_CRYPTO_CURRENCY_SELECT } from 'src/constants/wallet/trading/form';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingVerifyOptionsItemProps } from 'src/types/trading/tradingVerify';
import { isTradingExchangeContext } from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingBalance } from 'src/views/wallet/trading/common/TradingBalance';

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const TradingVerifyOptionsItem = ({
    option,
    receiveNetwork,
}: TradingVerifyOptionsItemProps) => {
    const context = useTradingFormContext();
    const { cryptoIdToPlatformName, cryptoIdToCoinName } = useTradingInfo(context.type);
    const iconSize = 24;

    if (option.type === 'SUITE') {
        if (!option.account) return null;

        const { symbol, formattedBalance } = option.account;

        return (
            <Row gap={spacings.sm}>
                <CoinLogo size={iconSize} symbol={symbol} />
                <Column alignItems="flex-start">
                    <AccountName>
                        <AccountLabeling
                            account={option.account}
                            accountTypeBadgeSize="small"
                            showAccountTypeBadge
                        />
                    </AccountName>
                    <TradingBalance
                        balance={formattedBalance}
                        displaySymbol={getNetwork(symbol).displaySymbol}
                        symbol={symbol}
                        sendCryptoSelect={
                            isTradingExchangeContext(context)
                                ? context.getValues(FORM_SEND_CRYPTO_CURRENCY_SELECT)
                                : undefined
                        }
                    />
                </Column>
            </Row>
        );
    }

    const { networkId, contractAddress } = parseCryptoId(receiveNetwork);
    const networkName = contractAddress
        ? cryptoIdToPlatformName(networkId)
        : cryptoIdToCoinName(networkId);

    if (option.type === 'ADD_SUITE') {
        return (
            <Row gap={spacings.sm}>
                <Icon name="plus" size={iconSize} variant="tertiary" />
                <Column alignItems="flex-start">
                    <Translation
                        id="TR_EXCHANGE_CREATE_SUITE_ACCOUNT"
                        values={{
                            symbol: networkName,
                        }}
                    />
                </Column>
            </Row>
        );
    }

    return (
        <Row gap={spacings.sm}>
            <Icon name="arrowSquareOut" size={iconSize} variant="tertiary" />
            <Column alignItems="flex-start">
                <Translation
                    id="TR_EXCHANGE_USE_NON_SUITE_ACCOUNT"
                    values={{
                        symbol: networkName,
                    }}
                />
            </Column>
        </Row>
    );
};
