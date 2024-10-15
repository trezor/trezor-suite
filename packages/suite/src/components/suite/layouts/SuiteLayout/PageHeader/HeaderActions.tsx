import styled from 'styled-components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { ButtonGroup, Dropdown, DropdownMenuItemProps, IconName } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { WalletParams } from 'src/types/wallet';
import { Translation } from 'src/components/suite/Translation';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { TradeActions } from 'src/components/suite/layouts/SuiteLayout/PageHeader/TradeActions';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
`;

type ActionItem = {
    id: string;
    icon?: IconName;
    callback: () => void;
    title: JSX.Element;
    'data-testid'?: string;
    isHidden?: boolean;
};

export const HeaderActions = () => {
    const account = useSelector(selectSelectedAccount);
    const routerParams = useSelector(state => state.router.params) as WalletParams;
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const dispatch = useDispatch();
    const { device } = useDevice();
    const layoutSize = useSelector(state => state.resize.size);
    const showCoinmarketButtons = layoutSize === 'XLARGE';

    const accountType = account?.accountType || routerParams?.accountType || '';

    const goToWithAnalytics = (...[routeName, options]: Parameters<typeof goto>) => {
        if (account?.symbol) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: account.symbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };

    const additionalActions: ActionItem[] = [
        {
            id: 'wallet-sign-verify',
            callback: () => {
                goToWithAnalytics('wallet-sign-verify', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
            icon: 'pencilUnderscored',
            // show dots when acc missing as they are hidden only in case of XRP
            isHidden: account ? !hasNetworkFeatures(account, 'sign-verify') : false,
        },
        {
            id: 'wallet-coinmarket-buy',
            callback: () => {
                goToWithAnalytics('wallet-coinmarket-buy', { preserveParams: true });
            },
            title: <Translation id="TR_COINMARKET_BUY_AND_SELL" />,
            icon: 'currencyCircleDollar',
            isHidden: showCoinmarketButtons,
        },
    ];

    const visibleAdditionalActions = additionalActions?.filter(action => !action.isHidden);

    const isCoinmarketAvailable = !['coinjoin'].includes(accountType);
    const isAccountLoading = selectedAccount.status === 'loading';

    const isDeviceConnected = device?.connected && device?.available;

    return (
        <Container>
            {visibleAdditionalActions?.length > 0 && (
                <AppNavigationTooltip>
                    <Dropdown
                        alignMenu="bottom-right"
                        isDisabled={isAccountLoading}
                        data-testid="@wallet/menu/extra-dropdown"
                        items={[
                            {
                                key: 'extra',
                                options: visibleAdditionalActions.map<DropdownMenuItemProps>(
                                    item => ({
                                        key: item.id,
                                        onClick: isAccountLoading ? undefined : item.callback,
                                        label: item.title,
                                        'data-testid': `@wallet/menu/${item.id}`,
                                    }),
                                ),
                            },
                        ]}
                    />
                </AppNavigationTooltip>
            )}

            {isCoinmarketAvailable && (
                <TradeActions
                    analyticsEventType={EventType.AccountsActions}
                    selectedAccount={selectedAccount}
                />
            )}

            <AppNavigationTooltip>
                <ButtonGroup size="small" isDisabled={isAccountLoading}>
                    <HeaderActionButton
                        key="wallet-send"
                        icon="send"
                        onClick={() => {
                            goToWithAnalytics('wallet-send', { preserveParams: true });
                        }}
                        data-testid="@wallet/menu/wallet-send"
                        variant={isDeviceConnected ? 'primary' : 'tertiary'}
                    >
                        <Translation id="TR_NAV_SEND" />
                    </HeaderActionButton>

                    <HeaderActionButton
                        key="wallet-receive"
                        icon="receive"
                        onClick={() => {
                            goToWithAnalytics('wallet-receive', { preserveParams: true });
                        }}
                        data-testid="@wallet/menu/wallet-receive"
                        variant={isDeviceConnected ? 'primary' : 'tertiary'}
                    >
                        <Translation id="TR_NAV_RECEIVE" />
                    </HeaderActionButton>
                </ButtonGroup>
            </AppNavigationTooltip>
        </Container>
    );
};
