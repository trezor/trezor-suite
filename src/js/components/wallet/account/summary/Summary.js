/* @flow */


import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import { Async as AsyncSelect } from 'react-select';
import Tooltip from 'rc-tooltip';

import { resolveAfter } from '~/js/utils/promiseUtils';
import SelectedAccount from '../SelectedAccount';
import { Notification } from '~/js/components/common/Notification';
import SummaryDetails from './SummaryDetails.js';
import SummaryTokens from './SummaryTokens.js';
import * as stateUtils from '~/js/reducers/utils';

import type { Props } from './index';
import type { NetworkToken } from '~/js/reducers/LocalStorageReducer';

const Summary = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const {
        account,
        network,
        tokens,
        pending,
    } = props.selectedAccount;

    // flow
    if (!device || !account || !network) return null;

    const tokensTooltip = (
        <div className="tooltip-wrapper">
            Insert token name, symbol or address to be able to send it.
        </div>
    );
    const explorerLink: string = `${network.explorer.address}${account.address}`;

    const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, network.symbol);
    const balance: string = new BigNumber(account.balance).minus(pendingAmount).toString(10);

    return (
        <div>
            <h2 className={`summary-header ${account.network}`}>
                Account #{ parseInt(account.index) + 1 }
                <a href={explorerLink} className="gray" target="_blank" rel="noreferrer noopener">See full transaction history</a>
            </h2>

            <SummaryDetails
                coin={network}
                summary={props.summary}
                balance={balance}
                network={network.network}
                fiat={props.fiat}
                localStorage={props.localStorage}
                onToggle={props.onDetailsToggle}
            />

            <h2>
                Tokens
                <Tooltip
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                    overlay={tokensTooltip}
                    placement="top"
                >
                    <span className="what-is-it" />
                </Tooltip>
            </h2>
            {/* 0x58cda554935e4a1f2acbe15f8757400af275e084 Lahod */}
            {/* 0x58cda554935e4a1f2acbe15f8757400af275e084 T01 */}
            <div className="filter">
                <AsyncSelect
                    className="token-select"
                    multi={false}
                    autoload={false}
                    ignoreCase
                    backspaceRemoves
                    value={null}
                    onChange={token => props.addToken(token, account)}
                    loadOptions={input => props.loadTokens(input, account.network)}
                    filterOptions={
                        (options: Array<NetworkToken>, search: string, values: Array<NetworkToken>) => options.map((o) => {
                            const added = tokens.find(t => t.symbol === o.symbol);
                            if (added) {
                                return {
                                    ...o,
                                    name: `${o.name} (Already added)`,
                                    disabled: true,
                                };
                            }
                            return o;
                        })
                    }
                    valueKey="symbol"
                    labelKey="name"
                    placeholder="Search for token"
                    searchPromptText="Type token name or address"
                    noResultsText="Token not found"
                />

            </div>

            <SummaryTokens
                pending={pending}
                tokens={tokens}
                removeToken={props.removeToken}
            />

        </div>
    );
};

export default (props: Props) => (
    <SelectedAccount {...props}>
        <Summary {...props} />
    </SelectedAccount>
);