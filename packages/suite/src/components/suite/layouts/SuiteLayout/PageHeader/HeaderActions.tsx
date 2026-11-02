import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectRouterParams } from '@suite/router';
import { getTradingPrefilledFromAccountData } from '@suite-common/trading';
import { Row } from '@trezor/components';
import { ButtonGroup } from '@trezor/components/src/components/buttons/ButtonGroup/ButtonGroup';
import { ArrowDownIcon, ArrowUpIcon } from '@trezor/icons';

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

    const { account } = selectedAccount;
    const accountType = account?.accountType || routerParams?.accountType || '';
    const isTradingAvailable = !['coinjoin'].includes(accountType);
    const isAccountLoading = selectedAccount.status === 'loading';
    const isDeviceConnected = device?.connected && device?.available;
    const accountPrefill = account ? getTradingPrefilledFromAccountData(account) : undefined;

    return (
        <Row gap={12} alignItems="center">
            <HeaderDropdown isDisabled={isAccountLoading} showSignAndVerify />

            {isTradingAvailable && (
                <TradeActions
                    source={{
                        from: account ? 'account/header' : 'dashboard/header',
                        networkSymbol: account?.symbol,
                    }}
                    prefill={{ buy: accountPrefill, sell: accountPrefill }}
                    isDisabled={isAccountLoading}
                />
            )}

            <AppNavigationTooltip>
                <ButtonGroup
                    isDisabled={isAccountLoading}
                    intent={isDeviceConnected ? 'brand' : 'neutral'}
                    priority={isDeviceConnected ? 'primary' : 'secondary'}
                >
                    <HeaderActionButton
                        key="wallet-receive"
                        icon={ArrowDownIcon}
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
                        icon={ArrowUpIcon}
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
        </Row>
    );
};
