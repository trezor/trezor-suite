import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { CoinLogo, variables } from '@trezor/components';
import l10nCommonMessages from '@suite-views/index.messages';
import { MessageDescriptor } from '@suite/types/suite';
import l10nMessages from '@wallet-views/account/messages';
import { Account } from '@wallet-types';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const AccountTitle = styled.div`
    font-size: ${FONT_SIZE.WALLET_TITLE};
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const StyledCoinLogo = styled(CoinLogo)`
    margin-right: 10px;
`;

export const getTitleForNetwork = (symbol: Account['symbol']) => {
    switch (symbol.toLowerCase()) {
        case 'btc':
            return l10nMessages.TR_NETWORK_BITCOIN;
        case 'test':
            return l10nMessages.TR_NETWORK_BITCOIN_TESTNET;
        case 'bch':
            return l10nMessages.TR_NETWORK_BITCOIN_CASH;
        case 'btg':
            return l10nMessages.TR_NETWORK_BITCOIN_GOLD;
        case 'dash':
            return l10nMessages.TR_NETWORK_DASH;
        case 'dgb':
            return l10nMessages.TR_NETWORK_DIGIBYTE;
        case 'doge':
            return l10nMessages.TR_NETWORK_DOGECOIN;
        case 'ltc':
            return l10nMessages.TR_NETWORK_LITECOIN;
        case 'nmc':
            return l10nMessages.TR_NETWORK_NAMECOIN;
        case 'vtc':
            return l10nMessages.TR_NETWORK_VERTCOIN;
        case 'zec':
            return l10nMessages.TR_NETWORK_ZCASH;
        case 'eth':
            return l10nMessages.TR_NETWORK_ETHEREUM;
        case 'trop':
            return l10nMessages.TR_NETWORK_ETHEREUM_TESTNET;
        case 'etc':
            return l10nMessages.TR_NETWORK_ETHEREUM_CLASSIC;
        case 'xem':
            return l10nMessages.TR_NETWORK_NEM;
        case 'xlm':
            return l10nMessages.TR_NETWORK_STELLAR;
        case 'ada':
            return l10nMessages.TR_NETWORK_CARDANO;
        case 'xtz':
            return l10nMessages.TR_NETWORK_TEZOS;
        case 'xrp':
            return l10nMessages.TR_NETWORK_XRP;
        case 'txrp':
            return l10nMessages.TR_NETWORK_XRP_TESTNET;
        default:
            return l10nMessages.TR_NETWORK_UNKNOWN;
    }
};

export const getTypeForNetwork = (accountType: Account['accountType']) => {
    switch (accountType) {
        case 'normal':
            return null;
        case 'segwit':
            return l10nMessages.TR_NETWORK_TYPE_SEGWIT;
        case 'legacy':
            return l10nMessages.TR_NETWORK_TYPE_LEGACY;
        // no default
    }
};

interface Props {
    account: Account;
    message?: MessageDescriptor;
}

const AccountName = ({ account, message }: Props) => {
    return (
        <Wrapper>
            <StyledCoinLogo size={24} symbol={account.symbol} />
            <AccountTitle>
                {message && (
                    <FormattedMessage
                        {...message}
                        values={{
                            network: <FormattedMessage {...getTitleForNetwork(account.symbol)} />,
                        }}
                    />
                )}
                {!message && <FormattedMessage {...getTitleForNetwork(account.symbol)} />}
                {` (${getTypeForNetwork(account.accountType)}) `}
                <FormattedMessage
                    {...(account.imported
                        ? l10nCommonMessages.TR_IMPORTED_ACCOUNT_HASH
                        : l10nCommonMessages.TR_ACCOUNT_HASH)}
                    values={{ number: String(account.index + 1) }}
                />
            </AccountTitle>
        </Wrapper>
    );
};

export default AccountName;
