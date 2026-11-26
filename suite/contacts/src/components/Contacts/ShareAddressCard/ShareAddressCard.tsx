import { useSelector } from 'react-redux';

import { Translation, useTranslation } from '@suite/intl';
import { selectIsDeviceRemembered } from '@suite-common/device';
import { getNetwork } from '@suite-common/wallet-config';
import { Banner, Button, Card, Column, H3, Paragraph, Row, Select, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';

import { useShareContactAddress } from './useShareContactAddress';
import { ContactsErrorMessage } from '../ContactsErrorMessage';

type AccountOption = {
    value: string;
    label: string;
};

/**
 * The receiver's side: hands a contact an address the Trezor attested, as text for any chat. The
 * contact pastes it into their contact for this wallet, and their Trezor then shows this wallet's
 * name for the payment.
 */
export const ShareAddressCard = () => {
    const isRemembered = useSelector(selectIsDeviceRemembered);
    const { translationString } = useTranslation();
    const {
        accounts,
        accountKey,
        setAccountKey,
        isSharing,
        share,
        shareText,
        error,
        shareAddress,
    } = useShareContactAddress();

    const options: AccountOption[] = accounts.map(account => ({
        value: account.key,
        label: translationString('TR_CONTACTS_SHARE_ACCOUNT_OPTION', {
            account: `${getNetwork(account.symbol).name} #${account.index + 1}`,
            path: account.path,
        }),
    }));

    return (
        <Card data-testid="@contacts/share">
            <Column gap={12} alignItems="stretch">
                <H3>
                    <Translation id="TR_CONTACTS_SHARE_TITLE" />
                </H3>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_CONTACTS_SHARE_DESCRIPTION" />
                </Paragraph>

                {!isRemembered && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_CONTACTS_SHARE_NOT_REMEMBERED" />}
                    />
                )}
                {isRemembered && options.length === 0 && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_CONTACTS_SHARE_NO_ACCOUNT" />
                    </Text>
                )}
                {isRemembered && options.length > 0 && (
                    <Row gap={8} alignItems="flex-end" flexWrap="wrap">
                        <Select
                            label={<Translation id="TR_ACCOUNT" />}
                            options={options}
                            value={options.find(option => option.value === accountKey)}
                            onChange={(option: AccountOption) =>
                                setAccountKey(
                                    accounts.find(account => account.key === option.value)?.key,
                                )
                            }
                            isDisabled={isSharing}
                            flex="1"
                            data-testid="@contacts/share/account"
                        />
                        <Button
                            isLoading={isSharing}
                            onClick={shareAddress}
                            data-testid="@contacts/share/submit"
                        >
                            <Translation id="TR_CONTACTS_SHARE_BUTTON" />
                        </Button>
                    </Row>
                )}

                {error !== undefined && (
                    <Text typographyStyle="body-sm" intent="critical">
                        <ContactsErrorMessage error={error} />
                    </Text>
                )}

                {share !== undefined && shareText !== undefined && (
                    <Column gap={8} alignItems="stretch" data-testid="@contacts/share/result">
                        <Text isMonospaced typographyStyle="body-sm">
                            {share.address}
                        </Text>
                        <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_CONTACTS_SHARE_RESULT" />
                        </Paragraph>
                        <Text
                            isMonospaced
                            typographyStyle="body-xs"
                            wordBreak="break-all"
                            data-testid="@contacts/share/text"
                        >
                            {shareText}
                        </Text>
                        <Row>
                            <Button
                                size="small"
                                priority="secondary"
                                onClick={() => copyToClipboard(shareText)}
                            >
                                <Translation id="TR_COPY_TO_CLIPBOARD" />
                            </Button>
                        </Row>
                    </Column>
                )}
            </Column>
        </Card>
    );
};
