import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { Row } from '@trezor/components';
import { ButtonGroup } from '@trezor/components/src/components/buttons/ButtonGroup/ButtonGroup';
import { ArrowDownIcon, ArrowUpIcon } from '@trezor/icons';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { TradeActions } from 'src/components/suite/layouts/SuiteLayout/PageHeader/TradeActions';
import { useSelector } from 'src/hooks/suite';

import { HeaderDropdown } from './HeaderDropdown';
import { useGoToWithAnalytics } from './useGoToWithAnalytics';

export const HeaderActions = () => {
    const goToWithAnalytics = useGoToWithAnalytics();
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { device } = useDevice();

    // Suite Dark flavour: trading hidden
    const isTradingAvailable = false;
    const isAccountLoading = selectedAccount.status === 'loading';
    const isDeviceConnected = device?.connected && device?.available;

    return (
        <Row gap={12} alignItems="center">
            <HeaderDropdown isDisabled={isAccountLoading} showSignAndVerify />

            {isTradingAvailable && <TradeActions selectedAccount={selectedAccount} />}

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
