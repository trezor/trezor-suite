import AccountsMenu from './AccountsMenu';
import DiscoveryProgress from './DiscoveryProgress';
import Title from './Title';
import WalletLayout from './WalletLayout';
import WalletLayoutHeader from './WalletLayout/components/WalletLayoutHeader';
import {
    WalletLayoutNavigation,
    WalletLayoutNavLink,
} from './WalletLayout/components/WalletLayoutNavigation';
import CoinBalance from './CoinBalance';
import OnOffSwitcher from './OnOffSwitcher';
import InputError from './InputError';
import AccountExceptionLayout from './AccountExceptionLayout';

import CoinmarketLayout from './CoinmarketLayout';
import {
    CoinmarketBuyTopPanel,
    CoinmarketExchangeTopPanel,
    CoinmarketSellTopPanel,
} from './CoinmarketTopPanel';
import CoinmarketProvidedByInvity from './CoinmarketProvidedByInvity';
import CoinmarketPaymentType from './CoinmarketPaymentType';
import CoinmarketFooter from './CoinmarketFooter';
import CoinmarketBuyOfferInfo from './CoinmarketBuyOfferInfo';
import CoinmarketSellOfferInfo from './CoinmarketSellOfferInfo';
import CoinmarketExchangeOfferInfo from './CoinmarketExchangeOfferInfo';
import CoinmarketTransactionId from './CoinmarketTransactionId';
import CoinmarketProviderInfo from './CoinmarketProviderInfo';
import CoinmarketRefreshTime from './CoinmarketRefreshTime';
import CoinmarketAuthentication from './CoinmarketAuthentication';
import {
    withCoinmarketAuthentication,
    withCoinmarketLoaded,
    withCoinmarketSavingsLoaded,
    WithCoinmarketLoadedProps,
} from './hocs';

export {
    Title,
    AccountsMenu,
    WalletLayout,
    WalletLayoutHeader,
    WalletLayoutNavigation,
    WalletLayoutNavLink,
    DiscoveryProgress,
    CoinBalance,
    CoinmarketLayout,
    CoinmarketBuyTopPanel,
    CoinmarketSellTopPanel,
    CoinmarketExchangeTopPanel,
    CoinmarketFooter,
    CoinmarketProviderInfo,
    CoinmarketBuyOfferInfo,
    CoinmarketSellOfferInfo,
    CoinmarketExchangeOfferInfo,
    CoinmarketTransactionId,
    CoinmarketProvidedByInvity,
    CoinmarketPaymentType,
    CoinmarketRefreshTime,
    CoinmarketAuthentication,
    withCoinmarketAuthentication,
    withCoinmarketLoaded,
    withCoinmarketSavingsLoaded,
    OnOffSwitcher,
    InputError,
    AccountExceptionLayout,
};
export type { WithCoinmarketLoadedProps };
