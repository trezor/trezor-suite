import styled, { useTheme } from 'styled-components';
import { variables, CoinLogo, Select, Icon } from '@trezor/components';
import {
    FiatValue,
    Translation,
    AccountLabeling,
    FormattedCryptoAmount,
} from 'src/components/suite';
import {
    CoinmarketSelectedOfferVerifyOptionsProps,
    CoinmarketVerifyFormAccountOptionProps,
} from 'src/types/coinmarket/coinmarketVerify';

const LogoWrapper = styled.div`
    display: flex;
    align-items: center;
    padding: 0 0 0 3px;
`;

const AccountWrapper = styled.div`
    display: flex;
    padding: 0 0 0 15px;
    flex-direction: column;
`;

const CryptoWrapper = styled.div`
    padding-right: 3px;
`;

const FiatWrapper = styled.div`
    padding: 0 0 0 3px;
`;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const AccountName = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const AccountType = styled.span`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    padding-left: 5px;
`;

// TODO: refactor with exchange redesign
const CoinmarketSelectedOfferVerifyOptions = ({
    receiveNetwork,
    selectAccountOptions,
    selectedAccountOption,
    onChangeAccount,
}: CoinmarketSelectedOfferVerifyOptionsProps) => {
    const theme = useTheme();

    return (
        <Select
            onChange={(selected: CoinmarketVerifyFormAccountOptionProps) =>
                onChangeAccount(selected)
            }
            value={selectedAccountOption}
            isClearable={false}
            options={selectAccountOptions}
            minValueWidth="70px"
            formatOptionLabel={(option: CoinmarketVerifyFormAccountOptionProps) => {
                switch (option.type) {
                    case 'SUITE': {
                        if (!option.account) return null;
                        const { symbol, formattedBalance } = option.account;

                        return (
                            <Option>
                                <LogoWrapper>
                                    <CoinLogo size={25} symbol={symbol} />
                                </LogoWrapper>
                                <AccountWrapper>
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
                                            <FormattedCryptoAmount
                                                value={formattedBalance}
                                                symbol={symbol}
                                            />
                                        </CryptoWrapper>
                                        •
                                        <FiatWrapper>
                                            <FiatValue amount={formattedBalance} symbol={symbol} />
                                        </FiatWrapper>
                                    </Amount>
                                </AccountWrapper>
                            </Option>
                        );
                    }
                    case 'ADD_SUITE':
                        return (
                            <Option>
                                <LogoWrapper>
                                    <Icon icon="PLUS" size={25} color={theme.TYPE_DARK_GREY} />
                                </LogoWrapper>
                                <AccountWrapper>
                                    <Translation
                                        id="TR_EXCHANGE_CREATE_SUITE_ACCOUNT"
                                        values={{
                                            symbol: receiveNetwork?.toUpperCase(),
                                        }}
                                    />
                                </AccountWrapper>
                            </Option>
                        );
                    case 'NON_SUITE':
                        return (
                            <Option>
                                <LogoWrapper>
                                    <Icon icon="NON_SUITE" size={25} color={theme.TYPE_DARK_GREY} />
                                </LogoWrapper>
                                <AccountWrapper>
                                    <Translation
                                        id="TR_EXCHANGE_USE_NON_SUITE_ACCOUNT"
                                        values={{
                                            symbol: receiveNetwork?.toUpperCase(),
                                        }}
                                    />
                                </AccountWrapper>
                            </Option>
                        );
                    default:
                        return null;
                }
            }}
            isDisabled={selectAccountOptions.length === 1}
            placeholder={
                <Translation
                    id="TR_EXCHANGE_SELECT_RECEIVE_ACCOUNT"
                    values={{ symbol: receiveNetwork?.toUpperCase() }}
                />
            }
        />
    );
};

export default CoinmarketSelectedOfferVerifyOptions;
