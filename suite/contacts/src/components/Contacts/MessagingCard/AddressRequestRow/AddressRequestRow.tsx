import { useState } from 'react';
import { useSelector } from 'react-redux';

import { Translation, useTranslation } from '@suite/intl';
import { getContactsSlip44 } from '@suite-common/contacts';
import { type SuiteSyncDataRootState, selectSuiteSyncContacts } from '@suite-common/suite-sync';
import { getNetwork } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Button, Column, Row, Select, Text } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';

import { useAnswerAddressRequest } from './useAnswerAddressRequest';
import { selectContactShareableAccounts } from '../../../../contactsSelectors';
import { ContactsErrorMessage } from '../../ContactsErrorMessage';

type AccountOption = {
    value: AccountKey;
    label: string;
};

export type AddressRequestRowProps = {
    staticSessionId: StaticSessionId;
    npub: string;
    slip44: number;
    onSent: (address: string) => void;
};

export const AddressRequestRow = ({
    staticSessionId,
    npub,
    slip44,
    onSent,
}: AddressRequestRowProps) => {
    const contactName = useSelector(
        (state: SuiteSyncDataRootState) =>
            selectSuiteSyncContacts(
                state,
                parseStaticSessionId(staticSessionId).walletDescriptor,
            ).find(contact => contact.npub === npub)?.name,
    );
    const shareableAccounts = useSelector(selectContactShareableAccounts);
    const [pickedAccountKey, setPickedAccountKey] = useState<AccountKey>();
    const { translationString } = useTranslation();
    const { isSending, error, send, dismiss } = useAnswerAddressRequest({ npub, slip44, onSent });

    const accounts = shareableAccounts.filter(account => getContactsSlip44(account) === slip44);
    const networkName = accounts[0] ? getNetwork(accounts[0].symbol).name : undefined;
    const accountKey =
        accounts.find(account => account.key === pickedAccountKey)?.key ?? accounts[0]?.key;
    const options: AccountOption[] = accounts.map(account => ({
        value: account.key,
        label: translationString('TR_CONTACTS_SHARE_ACCOUNT_OPTION', {
            account: `${getNetwork(account.symbol).name} #${account.index + 1}`,
            path: account.path,
        }),
    }));

    return (
        <Column gap={8} alignItems="stretch" data-testid={`@contacts/request/${npub}`}>
            <Column alignItems="flex-start" gap={4}>
                <Text typographyStyle="body-md-strong">
                    {contactName ?? <Translation id="TR_CONTACTS_REQUEST_UNKNOWN_SENDER" />}
                </Text>
                <Text isMonospaced typographyStyle="body-xs" wordBreak="break-all">
                    {npub}
                </Text>
                <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                    {networkName !== undefined ? (
                        <Translation
                            id="TR_CONTACTS_REQUEST_NETWORK"
                            values={{ network: networkName }}
                        />
                    ) : (
                        <Translation id="TR_CONTACTS_REQUEST_NO_ACCOUNT" />
                    )}
                </Text>
            </Column>

            {accountKey === undefined ? (
                <Row>
                    <Button size="small" priority="secondary" onClick={dismiss}>
                        <Translation id="TR_DISMISS" />
                    </Button>
                </Row>
            ) : (
                <Row gap={8} alignItems="flex-end" flexWrap="wrap">
                    {options.length > 1 && (
                        <Select
                            label={<Translation id="TR_ACCOUNT" />}
                            options={options}
                            value={options.find(option => option.value === accountKey)}
                            onChange={(option: AccountOption) => setPickedAccountKey(option.value)}
                            isDisabled={isSending}
                            flex="1"
                        />
                    )}
                    <Button
                        size="small"
                        isLoading={isSending}
                        onClick={() => send(accountKey)}
                        data-testid={`@contacts/request/${npub}/send`}
                    >
                        <Translation id="TR_CONTACTS_REQUEST_SEND" />
                    </Button>
                    <Button
                        size="small"
                        priority="secondary"
                        isDisabled={isSending}
                        onClick={dismiss}
                    >
                        <Translation id="TR_DISMISS" />
                    </Button>
                </Row>
            )}

            {error !== undefined && (
                <Text typographyStyle="body-sm" intent="critical">
                    <ContactsErrorMessage error={error} />
                </Text>
            )}
        </Column>
    );
};
