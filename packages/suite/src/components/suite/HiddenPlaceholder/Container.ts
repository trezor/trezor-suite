import { connect } from 'react-redux';
import { ReactNode } from 'react';

import { AppState } from '@suite-types';
import Component from './index';

const mapStateToProps = (state: AppState) => ({
    discreetMode: state.wallet.settings.discreetMode,
});

export type StateProps = ReturnType<typeof mapStateToProps>;

interface ExtendedProps extends StateProps {
    children: ReactNode;
    intensity?: number;
}
export type Props = StateProps & ExtendedProps;

export default connect(mapStateToProps)(Component);
