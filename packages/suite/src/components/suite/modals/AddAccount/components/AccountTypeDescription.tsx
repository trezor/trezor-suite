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
import { getBip43Type } from '@wallet-utils/accountUtils';
import { ExtendedMessageDescriptor } from '@suite-types';

const Info = styled(P)`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin: 20px 0;
`;

interface Description {
    description: ExtendedMessageDescriptor['id'];
    url: string;
}

const selectDescription = (network: Network): Description => {
    const bip43 = getBip43Type(network.bip43Path);
    switch (bip43) {
        case 'bip84':
            return {
                description: 'TR_ACCOUNT_TYPE_BIP84_DESC',
                url: WIKI_ACCOUNT_BIP84_URL,
            };
        case 'bip86':
            return {
                description: 'TR_ACCOUNT_TYPE_BIP86_DESC',
                url: WIKI_ACCOUNT_BIP86_URL,
            };
        case 'bip49':
            return {
                description: 'TR_ACCOUNT_TYPE_BIP49_DESC',
                url: WIKI_ACCOUNT_BIP49_URL,
            };
        default:
            return {
                description: 'TR_ACCOUNT_TYPE_BIP44_DESC',
                url: WIKI_ACCOUNT_BIP44_URL,
            };
    }
};

interface Props {
    network: Network;
    accountTypes?: Network[];
}

export const AccountTypeDescription = ({ network, accountTypes }: Props) => {
    if (!accountTypes || accountTypes.length <= 1) return null;
    const { description, url } = selectDescription(network);

    return (
        <Info size="small" textAlign="left">
            <Translation id={description} />{' '}
            <ExternalLink href={url} size="small">
                <Translation id="TR_LEARN_MORE" />
            </ExternalLink>
        </Info>
    );
};
