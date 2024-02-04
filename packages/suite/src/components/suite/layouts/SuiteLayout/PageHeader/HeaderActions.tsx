import styled from 'styled-components';
import { EventType, analytics } from '@trezor/suite-analytics';
import {
    Button,
    ButtonGroup,
    Dropdown,
    DropdownMenuItemProps,
    IconButton,
    IconProps,
} from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { getNetwork, hasNetworkFeatures } from '@suite-common/wallet-utils';
import { WalletParams } from 'src/types/wallet';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { openModal } from 'src/actions/suite/modalActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const Container = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
`;

type ActionItem = {
    id: string;
    icon?: IconProps['icon'];
    callback: () => void;
    title: JSX.Element;
    'data-test'?: string;
    isHidden?: boolean;
};

export const HeaderActions = () => {
    const account = useSelector(selectSelectedAccount);
    const routerParams = useSelector(state => state.router.params) as WalletParams;
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const dispatch = useDispatch();
    const layoutSize = useSelector(state => state.resize.size);
    const isMobileLayout = layoutSize === 'TINY';

    const network = getNetwork(routerParams?.symbol || '');
    const networkType = account?.networkType || network?.networkType || '';
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
            id: 'wallet-add-token',
            callback: () => {
                if (account?.symbol) {
                    analytics.report({
                        type: EventType.AccountsActions,
                        payload: { symbol: account.symbol, action: 'add-token' },
                    });
                }
                dispatch(openModal({ type: 'add-token' }));
            },
            title: <Translation id="TR_TOKENS_ADD" />,
            isHidden: !['ethereum'].includes(networkType),
        },
        {
            id: 'wallet-sign-verify',
            callback: () => {
                goToWithAnalytics('wallet-sign-verify', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
            icon: 'SIGNATURE',
            // show dots when acc missing as they are hidden only in case of XRP
            isHidden: account ? !hasNetworkFeatures(account, 'sign-verify') : false,
        },
    ];

    const visibleAdditionalActions = additionalActions?.filter(action => !action.isHidden);

    const isCoinmarketAvailable = !['coinjoin'].includes(accountType);
    const isAccountLoading = selectedAccount.status === 'loading';

    const ButtonComponent = isMobileLayout ? IconButton : Button;

    return (
        <Container>
            {visibleAdditionalActions?.length > 0 && (
                <AppNavigationTooltip>
                    <Dropdown
                        alignMenu="bottom-right"
                        isDisabled={isAccountLoading}
                        data-test="@wallet/menu/extra-dropdown"
                        items={[
                            {
                                key: 'extra',
                                options: visibleAdditionalActions.map<DropdownMenuItemProps>(
                                    item => ({
                                        key: item.id,
                                        onClick: isAccountLoading ? undefined : item.callback,
                                        label: item.title,
                                        'data-test': `@wallet/menu/${item.id}`,
                                    }),
                                ),
                            },
                        ]}
                    />
                </AppNavigationTooltip>
            )}

            {isCoinmarketAvailable && (
                <AppNavigationTooltip>
                    <ButtonComponent
                        icon="REFRESH"
                        onClick={() => {
                            goToWithAnalytics('wallet-coinmarket-buy', { preserveParams: true });
                        }}
                        data-test="@wallet/menu/wallet-coinmarket-buy"
                        variant="tertiary"
                        size="small"
                        isDisabled={isAccountLoading}
                    >
                        <Translation id="TR_NAV_TRADE" />
                    </ButtonComponent>
                </AppNavigationTooltip>
            )}

            <AppNavigationTooltip>
                <ButtonGroup size="small" isDisabled={isAccountLoading}>
                    <ButtonComponent
                        key="wallet-send"
                        icon="SEND"
                        onClick={() => {
                            goToWithAnalytics('wallet-send', { preserveParams: true });
                        }}
                        data-test="@wallet/menu/wallet-send"
                    >
                        <Translation id="TR_NAV_SEND" />
                    </ButtonComponent>

                    <ButtonComponent
                        key="wallet-receive"
                        icon="RECEIVE"
                        onClick={() => {
                            goToWithAnalytics('wallet-receive', { preserveParams: true });
                        }}
                        data-test="@wallet/menu/wallet-receive"
                    >
                        <Translation id="TR_NAV_RECEIVE" />
                    </ButtonComponent>
                </ButtonGroup>
            </AppNavigationTooltip>
        </Container>
    );
};
