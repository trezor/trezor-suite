import Component from './index';
import { AppState } from '@suite-types';
import { Network } from '@wallet-types';
import { connect } from 'react-redux';

const mapStateToProps = (state: AppState) => ({
    fiat: state.wallet.fiat,
    settings: state.wallet.settings,
});

interface Params {
    value: JSX.Element | null;
    rate: JSX.Element | null;
    timestamp: number | null;
}

type OwnProps = {
    amount: string;
    symbol: Network['symbol'];
    fiatCurrency?: string;
    children?: (props: Params) => React.ReactElement | null;
};

export type Props = ReturnType<typeof mapStateToProps> & OwnProps;

export default connect(mapStateToProps)(Component);
