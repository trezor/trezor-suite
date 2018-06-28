/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as ComposeTxActions from '../../actions/methods/ComposeTxActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const ComposeTransaction = (props: Props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        coin,
        outputs,
        locktimeEnabled,
        locktime,
        push,
    } = props.state;

    const { 
        onCoinChange,
        onOutputAdd,
        onOutputRemove,
        onOutputTypeChange,
        onOutputAddressChange,
        onOutputAmountChange,
        onOutputSendMax,
        onOpreturnDataChange,
        onOpreturnDataFormatChange,
        onLocktimeEnable,
        onLocktimeChange,
        onPushChange,
        onComposeTx
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    const outputsCollection = outputs.map((out, index) => {
        return (
            <div className={ `output-row ${ out.type }` } key={ index }>
                <div className="close" onClick={ event => onOutputRemove(index) }></div>

                <div className="row">
                    <label>Output type</label>
                    <label className="custom-checkbox align-left radio">
                        Regular
                        <input type="radio" name={ `output-type-${ index }` } checked={ out.type === 'regular' } onChange={ event => onOutputTypeChange(index, 'regular') } />
                        <span className="indicator"></span>
                    </label>
                    <label className="custom-checkbox align-left radio">
                        OP_RETURN
                        <input type="radio" name={ `output-type-${ index }` } checked={ out.type === 'opreturn' } onChange={ event => onOutputTypeChange(index, 'opreturn') } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="output-regular">
                    <div className="row">
                        <label>Address</label>
                        <input type="text" value={ out.address } onChange={ event => onOutputAddressChange(index, event.currentTarget.value) } />
                    </div>
                    <div className="row">
                        <label>Amount</label>
                        <input 
                            type="text" 
                            className="amount small" 
                            value={ out.amount }
                            disabled={ out.send_max ? 'disabled' : '' }
                            onChange={ event => onOutputAmountChange(index, event.currentTarget.value) } />
                        <label className="custom-checkbox align-left">
                            Send max
                            <input type="checkbox" className="send_max" checked={ out.send_max === true } onChange={ event => onOutputSendMax(index, event.target.checked) } />
                            <span className="indicator"></span>
                        </label>
                    </div>
                </div>

                <div className="output-opreturn">
                    <label>Data</label>
                    <textarea className="op_return_data" onChange={ event => onOpreturnDataChange(index, event.currentTarget.value) } value={ out.opreturn_data }>
                    </textarea>
                    <label className="custom-checkbox align-left">
                        Data in Hex format
                        <input type="checkbox" className="op_return_hexdata2" checked={ out.opreturn_hexdata } onChange={ event => onOpreturnDataFormatChange(index, event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

            </div>
        );
    });

    return (
        <section className="method-content">

            <div className="method-params">

                <CoinSelect 
                    obligatory={ true }
                    coin={ coin } 
                    onCoinChange={ onCoinChange } />

                <div className="output-group">
                    { outputsCollection }
                </div>

                <div className="row">
                    <label className="custom-checkbox">
                        Locktime
                        <input type="checkbox" value={ locktimeEnabled } onChange={ event => onLocktimeEnable(event.target.checked) }/>
                        <span className="indicator"></span>
                    </label>
                    <input type="text" className="locktime small" value={ locktime } disabled={ locktimeEnabled ? '' : 'disabled' } onChange={ event => onLocktimeChange(event.currentTarget.value) } />
                </div>

                <div className="row">
                    <label className="custom-checkbox">
                        Push
                        <input type="checkbox" value={ push } onChange={ event => onPushChange(event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                    <button onClick={ event => onComposeTx(params) }>Compose transaction</button>
                    <button onClick={ onOutputAdd }>Add recipient</button>
                </div>
            </div>

            <Response 
                response={ response }
                code={ code }
                tab={ tab }
                onTabChange={ onTabChange } />

        </section>
    );
}

export default connect( 
    (state: State) => {
        return {
            common: state.common,
            state: state.composeTx,
        };
    },
    (dispatch: Dispatch) => {
        return { 
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(ComposeTxActions, dispatch),
        };
    }
)(ComposeTransaction);