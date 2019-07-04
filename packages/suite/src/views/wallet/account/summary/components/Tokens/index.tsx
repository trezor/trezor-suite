import React from 'react';
import styled from 'styled-components';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import { H5, AsyncSelect, Tooltip, Icon, colors, icons as ICONS } from '@trezor/components';
import l10nCommonMessages from '@suite-views/index.messages';
import { Token, Transaction } from '@suite/types/wallet';
import MenuList from './components/MenuList';
import l10nSummaryMessages from '../../common.messages';
import AddedToken from './components/Token';
import AddTokenMessage from './components/AddTokenMessage';

const TokensHeadingWrapper = styled.div`
    display: flex;
    padding: 20px 0;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    margin-right: 1px;
`;

const TooltipContainer = styled.div`
    margin-left: 6px;
`;

const AsyncSelectWrapper = styled.div`
    padding-bottom: 32px;
`;

const AddedTokensWrapper = styled.div``;

interface Props extends InjectedIntlProps {
    loadTokens: (input: string, network: string) => void;
    removeToken: (token: Token) => void;
    addToken: (token: Token, account: any) => void;
    tokens: Token[];
    pending: Transaction[];
    isBalanceHidden: boolean;
    account: any;
}

const Tokens = (props: Props) => {
    return (
        <>
            <TokensHeadingWrapper>
                <H5>
                    <FormattedMessage {...l10nSummaryMessages.TR_TOKENS} />
                </H5>
                <TooltipContainer>
                    <Tooltip
                        maxWidth={200}
                        placement="top"
                        content={props.intl.formatMessage(l10nSummaryMessages.TR_INSERT_TOKEN_NAME)}
                    >
                        <StyledIcon icon={ICONS.HELP} color={colors.TEXT_SECONDARY} size={12} />
                    </Tooltip>
                </TooltipContainer>
            </TokensHeadingWrapper>
            <AsyncSelectWrapper>
                <AsyncSelect
                    isSearchable
                    withDropdownIndicator={false}
                    defaultOptions
                    value={null}
                    isMulti={false}
                    components={{ MenuList }}
                    placeholder={props.intl.formatMessage(
                        l10nSummaryMessages.TR_TYPE_IN_A_TOKEN_NAME,
                    )}
                    loadingMessage={() =>
                        props.intl.formatMessage(l10nCommonMessages.TR_LOADING_DOT_DOT_DOT)
                    }
                    noOptionsMessage={() =>
                        props.intl.formatMessage(l10nSummaryMessages.TR_TOKEN_NOT_FOUND)
                    }
                    onChange={token => {
                        if (token.name) {
                            const isAdded = props.tokens.find(t => t.symbol === token.symbol);
                            if (!isAdded) {
                                props.addToken(token, props.account);
                            }
                        }
                    }}
                    loadOptions={input => props.loadTokens(input, props.account.network)}
                    formatOptionLabel={option => {
                        const isAdded = props.tokens.find(t => t.symbol === option.symbol);
                        if (isAdded) {
                            return `${option.name} (${props.intl.formatMessage(
                                l10nSummaryMessages.TR_ALREADY_ADDED,
                            )})`;
                        }
                        return option.name;
                    }}
                    getOptionLabel={option => option.name}
                    getOptionValue={option => option.symbol}
                />
            </AsyncSelectWrapper>
            <AddedTokensWrapper>
                {props.tokens.length < 1 && <AddTokenMessage />}
                {props.tokens.map(token => (
                    <AddedToken
                        key={token.symbol}
                        token={token}
                        pending={props.pending}
                        removeToken={props.removeToken}
                        hideBalance={props.isBalanceHidden}
                    />
                ))}
            </AddedTokensWrapper>
        </>
    );
};

export default injectIntl(Tokens);
