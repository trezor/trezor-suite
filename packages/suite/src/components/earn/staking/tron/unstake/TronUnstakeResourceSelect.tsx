import { useWatch } from 'react-hook-form';

import { Translation, type TranslationKey } from '@suite/intl';
import { TRON_RESOURCE_TYPES, type TronResourceType } from '@suite-common/wallet-types';
import { Column, SelectBar, Text } from '@trezor/components';

import { useTronStakeContext } from '../TronStakeContext';

const RESOURCE_LABEL: Record<TronResourceType, TranslationKey> = {
    bandwidth: 'TR_EARN_TRON_BANDWIDTH',
    energy: 'TR_EARN_TRON_ENERGY',
};

const resourceOptions = TRON_RESOURCE_TYPES.map(type => ({
    value: type,
    label: <Translation id={RESOURCE_LABEL[type]} values={{ count: 0 }} />,
}));

export const TronUnstakeResourceSelect = () => {
    const { form, actions } = useTronStakeContext();
    const { control, setValue, resetField } = form.methods;

    const resourceType = useWatch({ control, name: 'resourceType' });

    const handleChange = (value: TronResourceType) => {
        setValue('resourceType', value);
        resetField('amount');
    };

    return (
        <Column gap={8}>
            <Text typographyStyle="body-md">
                <Translation id="TR_EARN_TRON_RESOURCE_TO_UNSTAKE" />
            </Text>

            <SelectBar
                options={resourceOptions}
                selectedOption={resourceType}
                isDisabled={!!actions.pendingTxid}
                onChange={handleChange}
            />
        </Column>
    );
};
