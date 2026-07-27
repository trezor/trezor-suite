import { useWatch } from 'react-hook-form';

import { Translation, type TranslationKey } from '@suite/intl';
import { type TronResourceType } from '@suite-common/wallet-types';
import { getResourceGain } from '@suite-common/wallet-utils';
import { Column, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useTronStakeContext } from '../TronStakeContext';
import { getCurrentResource } from './unstakeUtils';

const REDUCTION_LABEL: Record<TronResourceType, TranslationKey> = {
    bandwidth: 'TR_EARN_TRON_BANDWIDTH_REDUCTION',
    energy: 'TR_EARN_TRON_ENERGY_REDUCTION',
};

export const TronUnstakeResourceReduction = () => {
    const { account, form } = useTronStakeContext();

    const { control } = form.methods;

    const amount = useWatch({ control, name: 'amount' });
    const resourceType = useWatch({ control, name: 'resourceType' });

    if (account.networkType !== 'tron') {
        return null;
    }

    const { tronResources } = account.misc;

    const currentResource = getCurrentResource(account, resourceType);

    const gain = getResourceGain(amount, resourceType, tronResources);
    const reduction = Math.min(gain !== null ? Math.round(gain) : 0, currentResource);

    const newResource = new BigNumber(currentResource).minus(reduction).toNumber();

    return (
        <Row justifyContent="space-between" alignItems="center">
            <Text typographyStyle="body-md">
                <Translation id="TR_EARN_TRON_RESOURCE_REDUCTION" />
            </Text>
            <Column alignItems="flex-end" gap={2}>
                <Text typographyStyle="body-md">
                    <Translation id={REDUCTION_LABEL[resourceType]} values={{ count: reduction }} />
                </Text>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {currentResource} → {newResource}
                </Text>
            </Column>
        </Row>
    );
};
