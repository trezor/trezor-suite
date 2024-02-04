import styled from 'styled-components';
import { EventType, analytics } from '@trezor/suite-analytics';
import {
    Button,
    ButtonGroup,
    Dropdown,
    DropdownMenuItemProps,
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

type NavigationItem = {
    id: string;
    callback: () => void;
    title: JSX.Element;
    'data-test'?: string;
    isHidden?: boolean;
};

export type ActionItem = NavigationItem & {
    icon?: IconProps['icon'];
    extra?: boolean;
};

export const HeaderActions = () => {
    const account = useSelector(selectSelectedAccount);
    const routerParams = useSelector(state => state.router.params) as WalletParams;
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const dispatch = useDispatch();

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

    const ACTIONS: ActionItem[] = [
        {
            id: 'wallet-send',
            callback: () => {
                goToWithAnalytics('wallet-send', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_SEND" />,
            icon: 'SEND',
            isHidden: false,
        },
        {
            id: 'wallet-receive',
            callback: () => {
                goToWithAnalytics('wallet-receive', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_RECEIVE" />,
            icon: 'RECEIVE',
            isHidden: false,
        },
        {
            id: 'wallet-coinmarket-buy',
            callback: () => {
                goToWithAnalytics('wallet-coinmarket-buy', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_TRADE" />,
            icon: 'REFRESH',
            isHidden: ['coinjoin'].includes(accountType),
        },
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
            extra: true,
            isHidden: !['ethereum'].includes(networkType),
        },
        {
            id: 'wallet-sign-verify',
            callback: () => {
                goToWithAnalytics('wallet-sign-verify', { preserveParams: true });
            },
            title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
            icon: 'SIGNATURE',
            extra: true,
            // show dots when acc missing as they are hidden only in case of XRP
            isHidden: !account ? false : !hasNetworkFeatures(account, 'sign-verify'),
        },
    ];

    const visibleActions = ACTIONS?.filter(action => !action.isHidden);
    const itemsSecondaryWithExtra = visibleActions?.filter(item => item.extra);
    const buyAction = visibleActions?.find(item => item.id === 'wallet-coinmarket-buy');
    const otherActions = visibleActions?.filter(
        item => !item.extra && item.id !== 'wallet-coinmarket-buy',
    );

    const isAccountLoading = selectedAccount.status === 'loading';

    return (
        <Container>
            {!!itemsSecondaryWithExtra?.length && (
                <AppNavigationTooltip>
                    <Dropdown
                        alignMenu="bottom-right"
                        isDisabled={isAccountLoading}
                        data-test="@wallet/menu/extra-dropdown"
                        items={[
                            {
                                key: 'extra',
                                options: itemsSecondaryWithExtra.map<DropdownMenuItemProps>(
                                    item => {
                                        const { id, title } = item;
                                        return {
                                            key: id,
                                            onClick: isAccountLoading ? undefined : item.callback,
                                            label: title,
                                            'data-test': `@wallet/menu/${item.id}`,
                                        };
                                    },
                                ),
                            },
                        ]}
                    />
                </AppNavigationTooltip>
            )}

            {buyAction && (
                <AppNavigationTooltip>
                    <Button
                        icon={buyAction?.icon}
                        key={buyAction?.id}
                        onClick={buyAction?.callback}
                        data-test={`@wallet/menu/${buyAction?.id}`}
                        variant="tertiary"
                        size="small"
                        isDisabled={isAccountLoading}
                    >
                        {buyAction?.title}
                    </Button>
                </AppNavigationTooltip>
            )}

            {otherActions && (
                <AppNavigationTooltip>
                    <ButtonGroup size="small" isDisabled={isAccountLoading}>
                        {otherActions?.map(item => {
                            const { id, title, icon } = item;

                            return (
                                <Button
                                    icon={icon}
                                    key={id}
                                    onClick={item.callback}
                                    data-test={`@wallet/menu/${item.id}`}
                                    variant={
                                        id === 'wallet-coinmarket-buy' ? 'tertiary' : 'primary'
                                    }
                                >
                                    {title}
                                </Button>
                            );
                        })}
                    </ButtonGroup>
                </AppNavigationTooltip>
            )}
        </Container>
    );
};
