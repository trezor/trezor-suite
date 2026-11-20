import { use } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type SignAddressCategory, type SignAddressGroup } from '@suite-common/sign-verify';
import { Badge, type BadgeIntent, InputWrapper, Select } from '@suite-native/atoms';
import { Translation, type TxKeyPath, useTranslate } from '@suite-native/intl';
import { throwError } from '@trezor/utils';

import { SignVerifyContext, SignVerifyFormContext } from './SignVerifyContext';
import { SignVerifyCopyButton } from './SignVerifyCopyButton';

const CATEGORY_BADGES: Record<
    Exclude<SignAddressCategory, 'used'>,
    { label: TxKeyPath; intent: BadgeIntent }
> = {
    fresh: { label: 'signAndVerify.address.badges.fresh', intent: 'brand' },
    change: { label: 'signAndVerify.address.badges.change', intent: 'neutral' },
    stake: { label: 'signAndVerify.address.badges.stake', intent: 'info' },
};

type SignVerifyAddressSelectProps = {
    addressGroups: SignAddressGroup[];
};

export const SignVerifyAddressSelect = ({ addressGroups }: SignVerifyAddressSelectProps) => {
    const { outcome } = use(SignVerifyContext) ?? throwError('Missing SignVerify');
    const { values, errors, update } =
        use(SignVerifyFormContext) ?? throwError('Missing SignVerify form');

    const { translate } = useTranslate();
    const { AddressFormatter } = useFormatters();

    const addresses = addressGroups.flatMap(group => group.addresses);
    const options = addressGroups.flatMap(({ category, addresses: groupAddresses }) =>
        groupAddresses.map(({ address }) => ({
            value: address,
            label: AddressFormatter.format(address, { format: 'long' }),
            badge:
                category && category !== 'used' ? (
                    <Badge
                        label={translate(CATEGORY_BADGES[category].label)}
                        intent={CATEGORY_BADGES[category].intent}
                    />
                ) : undefined,
        })),
    );
    // A single address that is already selected is the only one the account can sign with.
    const isSelectable = addresses.length > 1 || values.address === '';
    const isSigned = outcome === 'signed';
    const title = <Translation id="signAndVerify.address.label" />;

    return (
        <InputWrapper label={title} error={errors.address}>
            <Select
                title={title}
                items={options}
                value={values.address === '' ? null : values.address}
                onSelectItem={address =>
                    update({
                        address,
                        path:
                            addresses.find(signAddress => signAddress.address === address)?.path ??
                            '',
                    })
                }
                rightIcon={isSigned && <SignVerifyCopyButton value={values.address} />}
                isReadOnly={!isSelectable || isSigned}
                hasError={errors.address !== undefined}
            />
        </InputWrapper>
    );
};
