import { useMemo } from 'react';
import { useFormState, useWatch } from 'react-hook-form';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation, useTranslation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { Column, Input, Row, Select, Text } from '@trezor/components';

import { formatApyValue } from '../../../utils/earnApyUtils';
import { useTronStakeContext } from '../TronStakeContext';
import { CUSTOM_REPRESENTATIVE } from './constants';

interface RepresentativeOption {
    value: string;
    name: string;
    address?: string;
    apr?: number;
}

type FormatContext = { context: 'menu' | 'value' };

export const TronVoteRepresentativeSelect = () => {
    const { translationString } = useTranslation();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { representatives, form, actions } = useTronStakeContext();
    const { control, setValue, register } = form.methods;

    const representative = useWatch({ control, name: 'representative' });
    const { errors } = useFormState({ control });
    const isDisabled = !!actions.pendingTxid;

    const { ref: customRef, ...customField } = register(
        'customRepresentativeAddress',
        form.customRepresentativeRules,
    );

    const options: RepresentativeOption[] = useMemo(() => {
        const baseOptions: RepresentativeOption[] =
            representatives.data?.map(({ address, name, apr }) => ({
                value: address,
                name,
                address,
                apr,
            })) ?? [];

        if (isDebugModeActive) {
            baseOptions.push({ value: CUSTOM_REPRESENTATIVE, name: '' });
        }

        return baseOptions;
    }, [representatives.data, isDebugModeActive]);

    const formatOptionLabel = (option: RepresentativeOption, { context }: FormatContext) => {
        if (option.value === CUSTOM_REPRESENTATIVE) {
            return (
                <Row justifyContent="space-between" alignItems="center" gap={12}>
                    <Translation id="TR_EARN_TRON_ENTER_DIFFERENT_REPRESENTATIVE" />
                    <DebugOnlyBadge />
                </Row>
            );
        }

        if (context === 'value') {
            return option.name;
        }

        return (
            <Row justifyContent="space-between" alignItems="center" gap={12}>
                <Column gap={2}>
                    <Text typographyStyle="body-md">{option.name}</Text>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {option.address}
                    </Text>
                </Column>
                <Text typographyStyle="body-md">
                    <Translation
                        id="TR_EARN_TRON_APR"
                        values={{ apr: formatApyValue(option.apr) }}
                    />
                </Text>
            </Row>
        );
    };

    return (
        <Column gap={12}>
            <Select
                options={options}
                value={options.find(option => option.value === representative) ?? null}
                onChange={(option: RepresentativeOption) =>
                    setValue('representative', option.value, { shouldValidate: true })
                }
                placeholder={<Translation id="TR_EARN_TRON_SELECT_REPRESENTATIVE" />}
                formatOptionLabel={formatOptionLabel}
                isSearchable={false}
                isClearable={false}
                isDisabled={isDisabled}
                isLoading={representatives.isLoading}
            />

            {representative === CUSTOM_REPRESENTATIVE && (
                <Input
                    innerRef={customRef}
                    {...customField}
                    placeholder={translationString('TR_EARN_TRON_ENTER_REPRESENTATIVE_ADDRESS')}
                    isDisabled={isDisabled}
                    hasError={!!errors.customRepresentativeAddress}
                    bottomText={errors.customRepresentativeAddress?.message}
                />
            )}
        </Column>
    );
};
