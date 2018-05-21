/* @flow */
'use strict';

import React from 'react';
import Tooltip from 'rc-tooltip';
import type { Props as BaseProps } from './index';

type Props = {
    selectedAccount: $ElementType<BaseProps, 'selectedAccount'>,
    sendForm: $ElementType<BaseProps, 'sendForm'>,
    sendFormActions: $ElementType<BaseProps, 'sendFormActions'>,
    children?: $ElementType<BaseProps, 'children'>,
};

const AdvancedForm = (props: Props) => {

    const selectedAccount = props.selectedAccount;
    if (!selectedAccount) return null;

    const { network } = selectedAccount;
    const { 
        coinSymbol,
        selectedCurrency,
        gasPrice,
        gasLimit,
        nonce,
        data,
        errors,
        warnings,
        infos,
        advanced
    } = props.sendForm;

    const {
        toggleAdvanced,
        onGasPriceChange,
        onGasLimitChange,
        onNonceChange,
        onDataChange
    } = props.sendFormActions;

    if (!advanced) return (
        <div className="advanced-container">
            <a className="advanced" onClick={ toggleAdvanced }>Advanced settings</a>
            { props.children }
        </div>
    );

    const nonceTooltip = (
        <div className="tooltip-wrapper">
            Nonce is.....<br/>
        </div>
    );

    const gasLimitTooltip = (
        <div className="tooltip-wrapper">
            Gas limit is the amount of gas to send with your transaction.<br/>
            <span>TX fee = gas price * gas limit</span> &amp; is paid to miners for including your TX in a block.<br/>
            Increasing this number will not get your TX mined faster.<br/>
            Default value for sending ETH is <span>{ gasLimit } WEI.</span>
        </div>
    );

    const gasPriceTooltip = (
        <div className="tooltip-wrapper">
            Gas Price is the amount you pay per unit of gas.<br/>
            <span>TX fee = gas price * gas limit</span> &amp; is paid to miners for including your TX in a block.<br/>
            Higher the gas price = faster transaction, but more expensive. Default is <span>{ gasPrice } GWEI.</span><br/>
            <a className="green" href="https://myetherwallet.github.io/knowledge-base/gas/what-is-gas-ethereum.html" target="_blank" rel="noreferrer noopener">Read more</a>
        </div>
    );

    const dataTooltip = (
        <div className="tooltip-wrapper">
            Data is usually used when you send transactions to contracts.
        </div>
    );



    return (
        <div className="advanced-container opened">
            <a className="advanced" onClick={ toggleAdvanced }>Advanced settings</a>
            <div className="row gas-row">
                {/* <div className="column nonce">
                    <label>
                        Nonce
                        <Tooltip
                            arrowContent={<div className="rc-tooltip-arrow-inner"></div>}
                            overlay={ nonceTooltip }
                            placement="top">
                            <span className="what-is-it"></span>
                        </Tooltip>
                    </label>
                    <input 
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        value={ nonce }
                        onChange={ event => onNonceChange(event.target.value) } />
                    { errors.nonce ? (<span className="error">{ errors.nonce }</span>) : null }
                    { warnings.nonce ? (<span className="warning">{ warnings.nonce }</span>) : null }
                </div> */}
                <div className="column">
                    <label>
                        Gas limit 
                        <Tooltip
                            arrowContent={<div className="rc-tooltip-arrow-inner"></div>}
                            overlay={ gasLimitTooltip }
                            placement="top">
                            <span className="what-is-it"></span>
                        </Tooltip>
                    </label>
                    <input 
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        value={ gasLimit }
                        disabled={ coinSymbol === selectedCurrency && data.length > 0 }
                        onChange={ event => onGasLimitChange(event.target.value) } />
                    { errors.gasLimit ? (<span className="error">{ errors.gasLimit }</span>) : null }
                    { warnings.gasLimit ? (<span className="warning">{ warnings.gasLimit }</span>) : null }
                </div>
                <div className="column">
                    <label>
                        Gas price 
                        <Tooltip
                            arrowContent={<div className="rc-tooltip-arrow-inner"></div>}
                            overlay={ gasPriceTooltip }
                            placement="top">
                            <span className="what-is-it"></span>
                        </Tooltip>
                    </label>
                    <input 
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        value={ gasPrice }
                        onChange={ event => onGasPriceChange(event.target.value) } />
                    { errors.gasPrice ? (<span className="error">{ errors.gasPrice }</span>) : null }
                </div>
            </div>

            <div className="row">
                <label>
                    Data
                    <Tooltip
                        arrowContent={<div className="rc-tooltip-arrow-inner"></div>}
                        overlay={ dataTooltip }
                        placement="top">
                        <span className="what-is-it"></span>
                    </Tooltip>
                </label>
                <textarea disabled={ coinSymbol !== selectedCurrency } value={ coinSymbol !== selectedCurrency ? '' : data } onChange={ event => onDataChange(event.target.value) }></textarea>
                { errors.data ? (<span className="error">{ errors.data }</span>) : null }
            </div>

            <div className="row">
                { props.children }
            </div>

        </div>
    )
}

export default AdvancedForm;