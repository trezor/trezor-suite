/* @flow */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { fetchLocale } from '@suite/actions/suiteActions';

import { State, Dispatch } from '@suite/types';

import LanguagePicker from './index';

const mapStateToProps = (state: State) => ({
    language: state.suite.language,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    fetchLocale: bindActionCreators(fetchLocale, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(LanguagePicker);
