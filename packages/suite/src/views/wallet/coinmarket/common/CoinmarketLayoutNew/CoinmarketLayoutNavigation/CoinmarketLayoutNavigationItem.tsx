import { IconName } from '@suite-common/icons';
import { TranslationKey } from '@suite-common/intl-types';
import { Route } from '@suite-common/suite-types';
import { getTitleForNetwork } from '@suite-common/wallet-utils';
import { typography, borders, spacingsPx } from '@trezor/theme';
import { Translation } from 'src/components/suite';
import { NavigationItem } from 'src/components/suite/layouts/SuiteLayout/Sidebar/NavigationItem';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import styled, { css } from 'styled-components';

const NavListItemWrapper = styled(NavigationItem)`
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    white-space: nowrap;
    gap: ${spacingsPx.xs};
    ${typography.body}

    ${({ isActive }) =>
        isActive
            ? css`
                  border-radius: ${borders.radii.full};
              `
            : ''}

    svg {
        width: 16px;
    }
`;

interface CoinmarketLayoutNavigationItemProps {
    route: Route['name'];
    title: TranslationKey;
    icon: IconName;
}

const CoinmarketLayoutNavigationItem = ({
    route,
    title,
    icon,
}: CoinmarketLayoutNavigationItemProps) => {
    const account = useSelector(selectSelectedAccount);
    const routeName = useSelector(state => state.router.route?.name);

    if (route === 'wallet-coinmarket-savings-setup' && account) {
        return (
            <NavListItemWrapper
                key="wallet-coinmarket-savings"
                isActive={!!routeName?.startsWith('wallet-coinmarket-savings')}
                goToRoute="wallet-coinmarket-savings-setup"
                icon="clock"
                nameId="TR_NAV_SAVINGS"
                dataTest="@coinmarket/menu/wallet-coinmarket-savings-setup"
                values={{
                    cryptoCurrencyName: <Translation id={getTitleForNetwork(account.symbol)} />,
                }}
                preserveParams
            />
        );
    }

    return (
        <NavListItemWrapper
            data-test={`@coinmarket/menu/${route}`}
            nameId={title}
            isActive={routeName === route}
            icon={icon}
            goToRoute={route}
            preserveParams
        />
    );
};

export default CoinmarketLayoutNavigationItem;
