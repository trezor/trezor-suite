import React from 'react';
import styled from 'styled-components';
import { P } from '@trezor/components';
import { Network } from '@wallet-types';
import { Translation, ExternalLink } from '@suite-components';
import {
    WIKI_ACCOUNT_BIP84_URL,
    WIKI_ACCOUNT_BIP86_URL,
    WIKI_ACCOUNT_BIP49_URL,
    WIKI_ACCOUNT_BIP44_URL,
} from '@suite-constants/urls';
import { getAccountTypeDesc, getAccountTypeUrl } from '@wallet-utils/accountUtils';

const Info = styled(P)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin: 20px 0;
`;

interface Props {
    network: Network;
    accountTypes?: Network[];
}

export const AccountTypeDescription = ({ network, accountTypes }: Props) => {
    if (!accountTypes || accountTypes.length <= 1) return null;
    const accountTypeUrl = getAccountTypeUrl(network.bip43Path);
    const accountTypeDesc = getAccountTypeDesc(network.bip43Path);

    return (
        <Info size="small" textAlign="left">
            <Translation id={accountTypeDesc} />{' '}
            <ExternalLink href={accountTypeUrl} size="small">
                <Translation id="TR_LEARN_MORE" />
            </ExternalLink>
        </Info>
    );
};
