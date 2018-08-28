/* @flow */
import styled from 'styled-components';
import React from 'react';
import { H2 } from 'components/Heading';
import TooltipContent from 'components/TooltipContent';
import BigNumber from 'bignumber.js';
import { Async as AsyncSelect } from 'react-select';
import Tooltip from 'rc-tooltip';

import CoinLogo from 'components/CoinLogo';
import * as stateUtils from 'reducers/utils';
import type { NetworkToken } from 'reducers/LocalStorageReducer';
import SelectedAccount from 'views/Wallet/components/SelectedAccount';
import Link from 'components/Link';
import SummaryDetails from './components/Details';
import SummaryTokens from './components/Tokens';

import type { Props } from './Container';

const AccountHeading = styled.div`
    padding: 20px 48px 20px 45px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const StyledH2 = styled(H2)`
    padding: 20px 48px;
`;

const AccountName = styled.div`
    display: flex;
    align-items: center;
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

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
        <TooltipContent>
            Insert token name, symbol or address to be able to send it.
        </TooltipContent>
    );
    const explorerLink: string = `${network.explorer.address}${account.address}`;

    const pendingAmount: BigNumber = stateUtils.getPendingAmount(pending, network.symbol);
    const balance: string = new BigNumber(account.balance).minus(pendingAmount).toString(10);

    return (
        <div>
            <AccountHeading network={account.networks}>
                <AccountName>
                    <StyledCoinLogo coinNetwork={account.network} />
                    <H2>Account #{parseInt(account.index, 10) + 1}</H2>
                </AccountName>
                <Link
                    target="_blank"
                    rel="noreferrer noopener"
                    href={explorerLink}
                    isGray
                >See full transaction history
                </Link>
            </AccountHeading>

            <SummaryDetails
                coin={network}
                summary={props.summary}
                balance={balance}
                network={network.network}
                fiat={props.fiat}
                localStorage={props.localStorage}
                onToggle={props.onDetailsToggle}
            />

            <StyledH2>
                Tokens
                <Tooltip
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                    overlay={tokensTooltip}
                    placement="top"
                >
                    <span className="what-is-it" />
                </Tooltip>
            </StyledH2>
            {/* 0x58cda554935e4a1f2acbe15f8757400af275e084 Lahod */}
            {/* 0x58cda554935e4a1f2acbe15f8757400af275e084 T01 */}
            <div className="filter">
                <AsyncSelect
                    className="token-select"
                    multi={false}
                    autoload
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