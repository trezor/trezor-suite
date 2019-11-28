/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import React from 'react';
import { Button } from '@trezor/components';

import { formatAmount, formatTime } from '../../utils/formatUtils';

interface Props {
    onChangeAccount: () => void;
    modalActions: any;
    modal: any;
    // todo:
}

const FeeSelection: React.FC<Props> = props => {
    const { onChangeAccount, onCustomFeeOpen, onCustomFeeChange, onFeeSelect } = props.modalActions;

    const { feeList, coinInfo, customFeeOpened, customFee } = props.modal;

    const feesCollection = feeList.map((feeItem, index) => {
        // skip custom
        if (feeItem.name === 'custom') return null;
        let feeName;
        if (feeItem.name === 'normal' && feeItem.bytes > 0) {
            feeName = (
                <div>
                    <span className="fee-name-normal">{feeItem.name}</span>
                    <span className="fee-name-subtitle">recommended</span>
                </div>
            );
        } else {
            feeName = <span className="fee-name">{feeItem.name}</span>;
        }

        if (feeItem.fee > 0) {
            return (
                <div className="fee" key={feeItem}>
                    <Button onClick={() => onFeeSelect(index)}>
                        {feeName}
                        <span className="fee-size">{formatAmount(feeItem.fee, coinInfo)}</span>
                        <span className="fee-minutes">{formatTime(feeItem.minutes)}</span>
                    </Button>
                </div>
            );
        }
        return (
            <div className="fee insufficient-funds" key={feeItem}>
                <Button isDisabled>
                    {feeName}
                    <span className="fee-insufficient-funds">Insufficient funds</span>
                </Button>
            </div>
        );
    });

    return (
        <div className="select-fee">
            <h3>Select fee:</h3>
            <div className="change_account" onClick={onChangeAccount}>
                <span>Change account</span>
            </div>
            <div className="select_fee_list">
                {feesCollection}
                <div className="fee">
                    <Button
                        className={`fee-custom-opener ${customFeeOpened ? 'opened' : 'untouched'}`}
                        onClick={onCustomFeeOpen}
                    >
                        <span className="fee-name">custom</span>
                        <span className="fee-insufficient-funds" />
                        <span className="fee-size" />
                        <span className="fee-minutes" />
                    </Button>
                    <div className={`fee-custom ${customFeeOpened ? '' : 'hidden'}`}>
                        <div className="fee-custom-wrapper">
                            <input
                                className="text"
                                value={customFee}
                                data-lpignore="true"
                                onChange={event => onCustomFeeChange(event.target.value)}
                            />
                            <div className="fee-custom-label">sat/B</div>
                            <Button className="fee-custom-button" isDisabled={false}>
                                SEND
                            </Button>
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
};

export default FeeSelection;
