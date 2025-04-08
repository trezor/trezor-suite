import { ButtonGroup, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { Translation } from 'src/components/suite/Translation';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { TradeActions } from 'src/components/suite/layouts/SuiteLayout/PageHeader/TradeActions';
import { useDevice, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { WalletParams } from 'src/types/wallet';

import { HeaderDropdown } from './HeaderDropdown';
import { useGoToWithAnalytics } from './useGoToWithAnalytics';

export const HeaderActions = () => {
    const goToWithAnalytics = useGoToWithAnalytics();
    const account = useSelector(selectSelectedAccount);
    const routerParams = useSelector(state => state.router.params) as WalletParams;
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const { device } = useDevice();

    const accountType = account?.accountType || routerParams?.accountType || '';
    const isTradingAvailable = !['coinjoin'].includes(accountType);
    const isAccountLoading = selectedAccount.status === 'loading';
    const isDeviceConnected = device?.connected && device?.available;
    const buttonVariant = isDeviceConnected ? 'primary' : 'tertiary';

    return (
        <Row gap={spacings.xxs} alignItems="center">
            <HeaderDropdown isDisabled={isAccountLoading} showSignAndVerify />

            {isTradingAvailable && <TradeActions selectedAccount={selectedAccount} />}

            <AppNavigationTooltip>
                <ButtonGroup size="small" isDisabled={isAccountLoading}>
                    <HeaderActionButton
                        key="wallet-send"
                        icon="arrowUp"
                        onClick={() => {
                            goToWithAnalytics('wallet-send', { preserveParams: true });
                        }}
                        data-testid="@wallet/menu/wallet-send"
                        variant={buttonVariant}
                    >
                        <Translation id="TR_NAV_SEND" />
                    </HeaderActionButton>

                    <HeaderActionButton
                        key="wallet-receive"
                        icon="arrowDown"
                        onClick={() => {
                            goToWithAnalytics('wallet-receive', { preserveParams: true });
                        }}
                        data-testid="@wallet/menu/wallet-receive"
                        variant={buttonVariant}
                    >
                        <Translation id="TR_NAV_RECEIVE" />
                    </HeaderActionButton>
                </ButtonGroup>
            </AppNavigationTooltip>
        </Row>
    );
};
