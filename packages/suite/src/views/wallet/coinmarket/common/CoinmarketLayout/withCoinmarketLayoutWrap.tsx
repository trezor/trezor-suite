import { Route } from '@suite-common/suite-types';
import { ComponentType, FunctionComponent } from 'react';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { useLayout } from 'src/hooks/suite';

interface PageHeaderProps {
    title?: string;
    backRoute: Extract<Route['name'], `wallet-coinmarket-${string}`>;
}

export const withCoinmarketLayoutWrap = (
    WrappedComponent: ComponentType<WithSelectedAccountLoadedProps>,
    options: PageHeaderProps,
): FunctionComponent<WithSelectedAccountLoadedProps> => {
    const { backRoute } = options;
    const title = options.title ?? 'Trezor Suite | Trade';

    const Component: FunctionComponent<WithSelectedAccountLoadedProps> = ({ ...props }) => {
        useLayout(title, () => <PageHeader backRoute={backRoute} />);

        return <WrappedComponent {...props} />;
    };

    Component.displayName = `withCoinmarketLayoutWrap(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return Component;
};
