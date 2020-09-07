import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BuyInfo, loadBuyInfo } from '@wallet-actions/coinmarketBuyActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import { useActions } from '@suite-hooks';
import { buildOption } from '@wallet-utils/coinmarket/coinmarketUtils';
import regional from '@wallet-constants/coinmarket/regional';
import { BuyTradeQuoteRequest } from 'invity-api';
import invityAPI from '@suite-services/invityAPI';
import * as coinmarketCommonActions from '@wallet-actions/coinmarketCommonActions';
import * as routerActions from '@suite-actions/routerActions';
import { getAmountLimits, processQuotes } from '@wallet-utils/coinmarket/buyUtils';
import {
    FormState,
    UseBuyFormProps,
    AmountLimits,
    BuyFormContextValues,
} from '@wallet-types/buyForm';

export const BuyFormContext = createContext<BuyFormContextValues | null>(null);
BuyFormContext.displayName = 'CoinmarketBuyContext';

export const useBuyForm = (props: UseBuyFormProps): BuyFormContextValues => {
    const { selectedAccount, cachedAccountInfo, quotesRequest } = props;
    const { account } = selectedAccount;
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const methods = useForm<FormState>({ mode: 'onChange' });
    const [buyInfo, setBuyInfo] = useState<BuyInfo>({
        providerInfos: {},
        supportedFiatCurrencies: new Set<string>(),
        supportedCryptoCurrencies: new Set<string>(),
    });

    const {
        saveQuoteRequest,
        saveQuotes,
        saveCachedAccountInfo,
        saveTrade,
        saveBuyInfo,
    } = useActions({
        saveQuoteRequest: coinmarketBuyActions.saveQuoteRequest,
        saveQuotes: coinmarketBuyActions.saveQuotes,
        saveBuyInfo: coinmarketBuyActions.saveBuyInfo,
        saveCachedAccountInfo: coinmarketBuyActions.saveCachedAccountInfo,
        saveTrade: coinmarketBuyActions.saveTrade,
    });

    const { goto } = useActions({
        goto: routerActions.goto,
    });

    const { verifyAddress } = useActions({
        verifyAddress: coinmarketCommonActions.verifyAddress,
    });

    const { register } = methods;

    useEffect(() => {
        if (selectedAccount.status === 'loaded') {
            invityAPI.createInvityAPIKey(selectedAccount.account?.descriptor);
            loadBuyInfo().then(bi => {
                setBuyInfo(bi);
                saveBuyInfo(bi);
            });
        }
    }, [selectedAccount, saveBuyInfo]);

    const onSubmit = async () => {
        const formValues = methods.getValues();
        const fiatStringAmount = formValues.fiatInput;
        const cryptoStringAmount = formValues.cryptoInput;
        const wantCrypto = !fiatStringAmount;
        const request: BuyTradeQuoteRequest = {
            wantCrypto,
            fiatCurrency: formValues.currencySelect.value.toUpperCase(),
            receiveCurrency: formValues.cryptoSelect.value,
            country: formValues.countrySelect.value,
            fiatStringAmount,
            cryptoStringAmount,
        };
        await saveQuoteRequest(request);
        await saveCachedAccountInfo(account.symbol, account.index, account.accountType);
        const allQuotes = await invityAPI.getBuyQuotes(request);
        const [quotes, alternativeQuotes] = processQuotes(allQuotes);
        const limits = getAmountLimits(request, quotes);

        if (limits) {
            setAmountLimits(limits);
        } else {
            await saveQuotes(quotes, alternativeQuotes);
            goto('wallet-coinmarket-buy-offers', {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            });
        }
    };

    const country = buyInfo.buyInfo?.country || regional.unknownCountry;
    const defaultCountry = {
        label: regional.countriesMap.get(country),
        value: country,
    };
    const defaultCurrencyInfo = buyInfo.buyInfo?.suggestedFiatCurrency;
    const defaultCurrency = defaultCurrencyInfo
        ? buildOption(defaultCurrencyInfo)
        : { label: 'USD', value: 'usd' };

    const accountHasCachedRequest =
        account.symbol === cachedAccountInfo.symbol &&
        account.index === cachedAccountInfo.index &&
        account.accountType === cachedAccountInfo.accountType;

    const typedRegister = useCallback(<T>(rules?: T) => register(rules), [register]);

    return {
        ...methods,
        account,
        onSubmit,
        defaultCountry,
        defaultCurrency,
        register: typedRegister,
        buyInfo,
        accountHasCachedRequest,
        cachedAccountInfo,
        saveQuoteRequest,
        saveQuotes,
        quotesRequest,
        saveCachedAccountInfo,
        verifyAddress,
        saveTrade,
        amountLimits,
        setAmountLimits,
    };
};

export const useBuyFormContext = () => {
    const context = useContext(BuyFormContext);
    if (context === null) throw Error('BuyFormContext used without Context');
    return context;
};
