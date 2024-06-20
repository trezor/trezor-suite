import { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import useTimeoutFn from 'react-use/lib/useTimeoutFn';
import { variables, CoinLogo, Select, Icon } from '@trezor/components';
import {
    FiatValue,
    Translation,
    AccountLabeling,
    FormattedCryptoAmount,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { getUnusedAddressFromAccount } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import type { UseFormReturn } from 'react-hook-form';
import type { Account } from 'src/types/wallet';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { cryptoToNetworkSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { AppState } from 'src/reducers/store';
import { networksCompatibility } from '@suite-common/wallet-config';

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

export type AccountSelectOption = {
    type: 'SUITE' | 'ADD_SUITE' | 'NON_SUITE';
    account?: Account;
};

type FormState = {
    address?: string;
};

type CoinmarketSelectedOfferVerifyOptionsProps = Pick<UseFormReturn<FormState>, 'setValue'> & {
    selectedAccountOption?: AccountSelectOption;
    setSelectedAccountOption: (o: AccountSelectOption) => void;
};

const CoinmarketSelectedOfferVerifyOptions = (props: CoinmarketSelectedOfferVerifyOptionsProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const { device, selectedQuote } = useCoinmarketFormContext<CoinmarketTradeBuyType>();
    const [suiteReceiveAccounts, setSuiteReceiveAccounts] =
        useState<AppState['wallet']['accounts']>();
    const isDebug = useSelector(selectIsDebugModeActive);

    const accounts = useSelector(state => state.wallet.accounts);

    const { selectedAccountOption, setSelectedAccountOption, setValue } = props;
    const receiveNetwork =
        selectedQuote?.receiveCurrency && cryptoToNetworkSymbol(selectedQuote?.receiveCurrency);
    const selectAccountOptions: AccountSelectOption[] = [];

    if (suiteReceiveAccounts) {
        suiteReceiveAccounts.forEach(account => {
            selectAccountOptions.push({ type: 'SUITE', account });
        });
        selectAccountOptions.push({ type: 'ADD_SUITE' });
    }
    selectAccountOptions.push({ type: 'NON_SUITE' });

    const selectAccountOption = (option: AccountSelectOption) => {
        setSelectedAccountOption(option);
        // setReceiveAccount(option.account);
        if (option.account) {
            const { address } = getUnusedAddressFromAccount(option.account);
            setValue('address', address, { shouldValidate: true });
        } else {
            setValue('address', '', { shouldValidate: false });
        }
    };

    const onChangeAccount = (account: AccountSelectOption) => {
        if (account.type === 'ADD_SUITE') {
            if (device) {
                dispatch(
                    openModal({
                        type: 'add-account',
                        device: device!,
                        symbol: receiveNetwork as Account['symbol'],
                        noRedirect: true,
                    }),
                );
            }
        } else {
            selectAccountOption(account);
        }
    };

    // preselect the account after everything is loaded
    useTimeoutFn(() => {
        if (selectAccountOptions.length > 0 && selectAccountOptions[0].type !== 'ADD_SUITE') {
            selectAccountOption(selectAccountOptions[0]);
        }
    }, 100);

    useEffect(() => {
        // exchangeStep === 'RECEIVING_ADDRESS'
        if (selectedQuote) {
            const unavailableCapabilities = device?.unavailableCapabilities ?? {};
            // is the symbol supported by the suite and the device natively
            const receiveNetworks = networksCompatibility.filter(
                n =>
                    n.symbol === receiveNetwork &&
                    !unavailableCapabilities[n.symbol] &&
                    ((n.isDebugOnly && isDebug) || !n.isDebugOnly),
            );
            if (receiveNetworks.length > 0) {
                // get accounts of the current symbol belonging to the current device
                setSuiteReceiveAccounts(
                    accounts.filter(
                        a =>
                            a.deviceState === device?.state &&
                            a.symbol === receiveNetwork &&
                            (!a.empty ||
                                a.visible ||
                                (a.accountType === 'normal' && a.index === 0)),
                    ),
                );

                return;
            }
        }
        setSuiteReceiveAccounts(undefined);
    }, [accounts, device, receiveNetwork, selectedQuote, isDebug]);

    return (
        <Select
            onChange={(selected: any) => onChangeAccount(selected)}
            value={selectedAccountOption}
            isClearable={false}
            options={selectAccountOptions}
            minValueWidth="70px"
            formatOptionLabel={(option: AccountSelectOption) => {
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
