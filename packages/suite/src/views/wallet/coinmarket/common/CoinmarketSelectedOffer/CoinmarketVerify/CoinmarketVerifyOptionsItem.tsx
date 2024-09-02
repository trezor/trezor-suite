import { CoinLogo, Column, Icon, Row, variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { AccountLabeling, Translation } from 'src/components/suite';
import { CoinmarketVerifyOptionsItemProps } from 'src/types/coinmarket/coinmarketVerify';
import { CoinmarketBalance } from 'src/views/wallet/coinmarket/common/CoinmarketBalance';
import styled, { useTheme } from 'styled-components';

const LogoWrapper = styled.div`
    padding: 0 0 0 ${spacingsPx.xxs};
`;

const AccountWrapper = styled.div`
    padding: 0 0 0 ${spacingsPx.md};
`;

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

export const CoinmarketVerifyOptionsItem = ({
    option,
    receiveNetwork,
}: CoinmarketVerifyOptionsItemProps) => {
    const theme = useTheme();
    const iconSize = 24;

    if (option.type === 'SUITE') {
        if (!option.account) return null;

        const { symbol, formattedBalance } = option.account;

        return (
            <Row alignItems="center">
                <LogoWrapper>
                    <Row alignItems="center">
                        <CoinLogo size={iconSize} symbol={symbol} />
                    </Row>
                </LogoWrapper>
                <AccountWrapper>
                    <Column alignItems="flex-start">
                        <AccountName>
                            <AccountLabeling
                                account={option.account}
                                accountTypeBadgeSize="small"
                                showAccountTypeBadge
                            />
                        </AccountName>
                        <CoinmarketBalance
                            balance={formattedBalance}
                            cryptoSymbolLabel={symbol.toLocaleUpperCase()}
                            networkSymbol={symbol}
                        />
                    </Column>
                </AccountWrapper>
            </Row>
        );
    }
    if (option.type === 'ADD_SUITE') {
        return (
            <Row>
                <LogoWrapper>
                    <Row alignItems="center">
                        <Icon name="plus" size={iconSize} color={theme.iconSubdued} />
                    </Row>
                </LogoWrapper>
                <AccountWrapper>
                    <Column alignItems="flex-start">
                        <Translation
                            id="TR_EXCHANGE_CREATE_SUITE_ACCOUNT"
                            values={{
                                symbol: receiveNetwork?.toUpperCase(),
                            }}
                        />
                    </Column>
                </AccountWrapper>
            </Row>
        );
    }

    return (
        <Row>
            <LogoWrapper>
                <Row alignItems="center">
                    <Icon name="nonSuite" size={iconSize} color={theme.iconSubdued} />
                </Row>
            </LogoWrapper>
            <AccountWrapper>
                <Column alignItems="flex-start">
                    <Translation
                        id="TR_EXCHANGE_USE_NON_SUITE_ACCOUNT"
                        values={{
                            symbol: receiveNetwork?.toUpperCase(),
                        }}
                    />
                </Column>
            </AccountWrapper>
        </Row>
    );
};
