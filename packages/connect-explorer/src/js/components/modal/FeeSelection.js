/* @flow */
'use strict';

import React from 'react';
import { formatAmount, formatTime } from '../../utils/formatUtils';

const FeeSelection = (props): any => {

    const {
        onChangeAccount,
        onCustomFeeOpen,
        onCustomFeeChange,
        onFeeSelect
    } = props.modalActions;

    const { 
        feeList,
        coinInfo,
        customFeeOpened,
        customFee 
    } = props.modal;


    const feesCollection = feeList.map((feeItem, index) => {
        // skip custom
        if (feeItem.name === 'custom') return null;
        let feeName;
        if (feeItem.name === 'normal' && feeItem.bytes > 0) {
            feeName = (
                <div>
                    <span className="fee-name-normal">{ feeItem.name }</span>
                    <span className="fee-name-subtitle">recommended</span>
                </div>
            );
        } else {
            feeName = (<span className="fee-name">{ feeItem.name }</span>);
        }

        let feeButton: string;

        if (feeItem.fee > 0) {
            return (
                <div className="fee" key={ index }>
                    <button onClick={ event => onFeeSelect(index) }>
                        { feeName }
                        <span className="fee-size">{ formatAmount(feeItem.fee, coinInfo) }</span>
                        <span className="fee-minutes">{ formatTime(feeItem.minutes) }</span>
                    </button>
                </div>
            );
        } else {
            return (
                <div className="fee insufficient-funds" key={ index }>
                    <button disabled>
                        { feeName }
                        <span className="fee-insufficient-funds">Insufficient funds</span>
                    </button>
                </div>
            );
        }
    });

    return (
        <div className="select-fee">
            <h3>Select fee:</h3>
            <div className="change_account" onClick={ onChangeAccount }>
                <span>Change account</span>
            </div>
            <div className="select_fee_list">
                { feesCollection }
                <div className="fee">
                    <button className={ `fee-custom-opener ${ customFeeOpened ? 'opened' : 'untouched' }` } onClick={ onCustomFeeOpen }>
                        <span className="fee-name">custom</span>
                        <span className="fee-insufficient-funds"></span>
                        <span className="fee-size"></span>
                        <span className="fee-minutes"></span>
                    </button>
                    <div className={ `fee-custom ${ customFeeOpened ? '' : 'hidden' }` }>
                        <div className="fee-custom-wrapper">
                            <input className="text" value={ customFee } data-lpignore="true" onChange={ event => onCustomFeeChange(event.target.value) } />
                            <div className="fee-custom-label">sat/B</div>
                            <button className="fee-custom-button" disabled="disabled">SEND</button>
                        </div>
                        <div className="fee-custom-warning">
                            <strong>Setting custom fee is not recommended.</strong>
                            If you set too low fee, it might get stuck forever.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FeeSelection;