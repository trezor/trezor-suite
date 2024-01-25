import styled, { css } from 'styled-components';
import { useDevice, useSelector } from 'src/hooks/suite';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { Translation } from 'src/components/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { FirmwareType } from '@trezor/connect';
import { TranslationKey } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { NavigationItem } from '../../../../../components/suite/Preloader/SuiteLayout/Sidebar/NavigationItem';
import { IconName } from '@suite-common/icons';
import { variables } from '@trezor/components';

const List = styled.div`
    display: flex;
    flex-direction: column;
    width: 171px;
    gap: ${spacingsPx.xxs};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
        flex-direction: row;
        overflow-x: auto;
    }
`;

const NavListItem = styled(NavigationItem)`
    white-space: nowrap;
    ${typography.body}

    ${({ isActive }) =>
        isActive
            ? css`
                  border-radius: ${borders.radii.full};
              `
            : ''}
`;

const Divider = styled.div`
    margin: ${spacingsPx.xxs} 0; /* gap xxs + margin xxs = spacing xs around divider */
    width: 100%;
    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation0};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        margin: 0 ${spacingsPx.xxs}; /* gap xxs + margin xxs = spacing xs around divider */
        flex-direction: row;
        border-bottom: 0;
        border-right: 1px solid ${({ theme }) => theme.borderOnElevation0};
    }
`;

export const CoinmarketLayoutNavigation = () => {
    const routeName = useSelector(state => state.router.route?.name);
    const account = useSelector(selectSelectedAccount);
    const p2pSupportedCoins = useSelector(
        state => state.wallet.coinmarket.p2p.p2pInfo?.supportedCoins,
    );
    const savingsProviders = useSelector(
        state => state.wallet.coinmarket.savings.savingsInfo?.savingsList?.providers,
    );
    const { device } = useDevice();

    const showP2pTab = account && p2pSupportedCoins && p2pSupportedCoins.has(account.symbol);
    const showSavingsTab =
        account &&
        savingsProviders &&
        savingsProviders.some(
            savingsProvider =>
                savingsProvider.isActive &&
                savingsProvider.tradedCoins.includes(account.symbol.toUpperCase()),
        );

    const isBitcoinOnly = device?.firmwareType === FirmwareType.BitcoinOnly;

    const Item = ({
        route,
        title,
        icon,
    }: {
        route: Route['name'];
        title: TranslationKey;
        icon: IconName;
    }) => (
        <NavListItem
            data-test={`@coinmarket/menu/${route}`}
            nameId={title}
            isActive={routeName === route}
            icon={icon}
            route={route}
            preserveParams
        />
    );

    return (
        <List>
            <Item route="wallet-coinmarket-buy" title="TR_NAV_BUY" icon="plus" />
            <Item route="wallet-coinmarket-sell" title="TR_NAV_SELL" icon="minus" />

            {!isBitcoinOnly ? (
                <Item route="wallet-coinmarket-exchange" title="TR_NAV_EXCHANGE" icon="trade" />
            ) : null}

            <Divider />

            {showSavingsTab && (
                <NavListItem
                    key="wallet-coinmarket-savings"
                    isActive={!!routeName?.startsWith('wallet-coinmarket-savings')}
                    route="wallet-coinmarket-savings-setup"
                    icon="clock"
                    nameId="TR_NAV_SAVINGS"
                    dataTest="@coinmarket/menu/wallet-coinmarket-savings-setup"
                    values={{
                        cryptoCurrencyName: <Translation id={getTitleForNetwork(account.symbol)} />,
                    }}
                    preserveParams
                />
            )}

            {showP2pTab && (
                <Item route="wallet-coinmarket-p2p" title="TR_NAV_P2P" icon="userFocus" />
            )}
            <Item route="wallet-coinmarket-spend" title="TR_NAV_SPEND" icon="label" />
        </List>
    );
};
