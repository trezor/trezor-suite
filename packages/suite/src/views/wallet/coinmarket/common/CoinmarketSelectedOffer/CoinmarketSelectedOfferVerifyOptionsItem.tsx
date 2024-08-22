import { CoinLogo, Column, IconLegacy, Row, variables } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';
import {
    AccountLabeling,
    FiatValue,
    FormattedCryptoAmount,
    Translation,
} from 'src/components/suite';
import { CoinmarketSelectedOfferVerifyOptionsItemProps } from 'src/types/coinmarket/coinmarketVerify';
import styled, { useTheme } from 'styled-components';

const LogoWrapper = styled.div`
    padding: 0 0 0 ${spacingsPx.xxs};
`;

const AccountWrapper = styled.div`
    padding: 0 0 0 ${spacingsPx.md};
`;

const CryptoWrapper = styled.div`
    padding-right: ${spacingsPx.xxs};
`;

const FiatWrapper = styled.div`
    padding: 0 0 0 ${spacingsPx.xxs};
`;

const Amount = styled.div`
    display: flex;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    ${typography.label}
`;

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AccountType = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    padding-left: ${spacingsPx.xxs};
`;

const CoinmarketSelectedOfferVerifyOptionsItem = ({
    option,
    receiveNetwork,
}: CoinmarketSelectedOfferVerifyOptionsItemProps) => {
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
                            <AccountLabeling account={option.account} />
                            <AccountType>
                                {option.account.accountType !== 'normal'
                                    ? option.account.accountType
                                    : ''}
                            </AccountType>
                        </AccountName>
                        <Amount>
                            <CryptoWrapper>
                                <FormattedCryptoAmount value={formattedBalance} symbol={symbol} />
                            </CryptoWrapper>
                            •
                            <FiatWrapper>
                                <FiatValue amount={formattedBalance} symbol={symbol} />
                            </FiatWrapper>
                        </Amount>
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
                        <IconLegacy icon="PLUS" size={iconSize} color={theme.TYPE_DARK_GREY} />
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
                    <IconLegacy icon="NON_SUITE" size={iconSize} color={theme.TYPE_DARK_GREY} />
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

export default CoinmarketSelectedOfferVerifyOptionsItem;
