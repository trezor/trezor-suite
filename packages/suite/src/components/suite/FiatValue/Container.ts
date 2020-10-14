import Component from './index';
import { AppState } from '@suite-types';
import { Network } from '@wallet-types';
import { connect } from 'react-redux';
import { TimestampedRates } from '@wallet-types/fiatRates';

const mapStateToProps = (state: AppState) => ({
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
});

interface Params {
    value: JSX.Element | null;
    rate: JSX.Element | null;
    timestamp: number | null;
}

interface CommonOwnProps {
    amount: string;
    symbol: Network['symbol'] | string;
    fiatCurrency?: string;
    children?: (props: Params) => React.ReactElement | null;
    badge?: { color: 'blue' | 'gray'; size?: 'small' };
    showApproximationIndicator?: boolean;
    disableHiddenPlaceholder?: boolean;
}

interface DefaultSourceProps extends CommonOwnProps {
    source?: never;
    useCustomSource?: never;
}

interface CustomSourceProps extends CommonOwnProps {
    source: TimestampedRates['rates'] | undefined | null;
    useCustomSource: boolean;
}

type OwnProps = DefaultSourceProps | CustomSourceProps;

export type Props = ReturnType<typeof mapStateToProps> & OwnProps;

// redux is breaking types union https://github.com/DefinitelyTyped/DefinitelyTyped/issues/35315
export default connect(mapStateToProps)(Component) as (props: OwnProps) => JSX.Element | null;
