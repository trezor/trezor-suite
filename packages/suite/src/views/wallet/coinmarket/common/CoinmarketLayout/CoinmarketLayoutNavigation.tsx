import styled, { css } from 'styled-components';
import { useDevice, useSelector } from 'src/hooks/suite';
import { TranslationKey } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { NavigationItem } from '../../../../../components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { variables, IconName } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

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

export const CoinmarketLayoutNavigation = () => {
    const routeName = useSelector(state => state.router.route?.name);

    const { device } = useDevice();

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
            data-testid={`@coinmarket/menu/${route}`}
            nameId={title}
            isActive={routeName === route}
            icon={icon}
            goToRoute={route}
            preserveParams
        />
    );

    return (
        <List>
            <Item route="wallet-coinmarket-buy" title="TR_NAV_BUY" icon="plus" />
            <Item route="wallet-coinmarket-sell" title="TR_NAV_SELL" icon="minus" />

            {!hasBitcoinOnlyFirmware(device) ? (
                <Item
                    route="wallet-coinmarket-exchange"
                    title="TR_COINMARKET_SWAP"
                    icon="arrowsLeftRight"
                />
            ) : null}
        </List>
    );
};
