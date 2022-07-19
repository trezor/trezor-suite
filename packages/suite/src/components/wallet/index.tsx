import AccountsMenu from './AccountsMenu';
import Title from './Title';
import { WalletLayout } from './WalletLayout';
import { WalletLayoutHeader } from './WalletLayout/components/WalletLayoutHeader';
import {
    WalletLayoutNavigation,
    WalletLayoutNavLink,
} from './WalletLayout/components/WalletLayoutNavigation';
import { CoinBalance } from './CoinBalance';
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
import { DiscoveryProgress } from './DiscoveryProgress';
import KYCInProgress from './KYCInProgress';
import KYCFailed from './KYCFailed';
import KYCError from './KYCError';
import { withCoinmarket, withSelectedAccountLoaded } from './hocs';
import type { WithCoinmarketProps, WithSelectedAccountLoadedProps } from './hocs';

export {
    Title,
    AccountsMenu,
    WalletLayout,
    WalletLayoutHeader,
    WalletLayoutNavigation,
    WalletLayoutNavLink,
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
    DiscoveryProgress,
    withCoinmarket,
    withSelectedAccountLoaded,
    OnOffSwitcher,
    InputError,
    AccountExceptionLayout,
    KYCInProgress,
    KYCFailed,
    KYCError,
};
export type { WithCoinmarketProps, WithSelectedAccountLoadedProps };
