import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectRouterParams } from '@suite/router';
import { getNetworkOptional } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';
import { ButtonGroup } from '@trezor/components/src/components/buttons/ButtonGroup/ButtonGroup';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { TradeActions } from 'src/components/suite/layouts/SuiteLayout/PageHeader/TradeActions';
import { useSelector } from 'src/hooks/suite';
import { type WalletParams } from 'src/types/wallet';

import { HeaderDropdown } from './HeaderDropdown';
import { useGoToWithAnalytics } from './useGoToWithAnalytics';

export const HeaderActions = () => {
    const goToWithAnalytics = useGoToWithAnalytics();
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const routerParams = useSelector(selectRouterParams) as WalletParams;
    const { device } = useDevice();

    const accountType = selectedAccount.account?.accountType || routerParams?.accountType || '';
    const symbol = selectedAccount.account?.symbol ?? routerParams?.symbol;
    const isTradingDisabledNetwork = !!getNetworkOptional(symbol)?.isTradingDisabled;
    const isTradingAvailable = !['coinjoin'].includes(accountType) && !isTradingDisabledNetwork;
    const isAccountLoading = selectedAccount.status === 'loading';
    const isDeviceConnected = device?.connected && device?.available;
    // Monero is unusable until the local node + client-side scan have caught up — hide receive/send
    // (and trading is already disabled) so the account can't be acted on mid-sync.
    const { account } = selectedAccount;
    const isMoneroNotReady = account?.networkType === 'monero' && !account.misc?.synced;

    return (
        <Row gap={12} alignItems="center">
            <HeaderDropdown isDisabled={isAccountLoading} showSignAndVerify />

            {isTradingAvailable && <TradeActions selectedAccount={selectedAccount} />}

            {!isMoneroNotReady && (
                <AppNavigationTooltip>
                    <ButtonGroup
                        isDisabled={isAccountLoading}
                        intent={isDeviceConnected ? 'brand' : 'neutral'}
                        priority={isDeviceConnected ? 'primary' : 'secondary'}
                    >
                        <HeaderActionButton
                            key="wallet-receive"
                            icon="arrowDown"
                            onClick={() => {
                                goToWithAnalytics({
                                    routeName: 'wallet-receive',
                                    preserveParams: true,
                                });
                            }}
                            data-testid="@wallet/menu/wallet-receive"
                        >
                            <Translation id="TR_NAV_RECEIVE" />
                        </HeaderActionButton>

                        <HeaderActionButton
                            key="wallet-send"
                            icon="arrowUp"
                            onClick={() => {
                                goToWithAnalytics({
                                    routeName: 'wallet-send',
                                    preserveParams: true,
                                });
                            }}
                            data-testid="@wallet/menu/wallet-send"
                        >
                            <Translation id="TR_NAV_SEND" />
                        </HeaderActionButton>
                    </ButtonGroup>
                </AppNavigationTooltip>
            )}
        </Row>
    );
};
