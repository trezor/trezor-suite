import Component from './index';
import { AppState } from '@suite-types';
import { Network } from '@wallet-types';
import { connect } from 'react-redux';
import { TimestampedRates } from '@suite/reducers/wallet/fiatRateReducer';

const mapStateToProps = (state: AppState) => ({
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
});

interface Params {
    value: JSX.Element | null;
    rate: JSX.Element | null;
    timestamp: number | null;
}

// TODO: doesn't work like it should
type CommonOwnProps = {
    amount: string;
    symbol: Network['symbol'] | string;
    fiatCurrency?: string;
    children?: (props: Params) => React.ReactElement | null;
};

type DefaultSourceProps = CommonOwnProps & {
    source?: undefined;
    useCustomSource?: undefined;
};

type CustomSourceProps = CommonOwnProps & {
    source: NonNullable<TimestampedRates['rates']> | null;
    useCustomSource: boolean;
};

type OwnProps = DefaultSourceProps | CustomSourceProps;

export type Props = ReturnType<typeof mapStateToProps> & OwnProps;

export default connect(mapStateToProps)(Component);
