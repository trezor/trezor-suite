import { useWatch } from 'react-hook-form';

import { Translation, type TranslationKey } from '@suite/intl';
import { getResourceGain } from '@suite-common/staking';
import { TRON_RESOURCE_TYPES, type TronResourceType } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Icon, Row, SelectBar, Text, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { useTronStakeContext } from '../TronStakeContext';

const RESOURCE_LABEL: Record<TronResourceType, TranslationKey> = {
    bandwidth: 'TR_EARN_TRON_BANDWIDTH',
    energy: 'TR_EARN_TRON_ENERGY',
};

export const TronFreezeResourceSelect = () => {
    const { account, form, actions } = useTronStakeContext();
    const { control, setValue } = form.methods;

    const amount = useWatch({ control, name: 'amount' });
    const resourceType = useWatch({ control, name: 'resourceType' });
    const tronResources = account.networkType === 'tron' ? account.misc.tronResources : undefined;

    const availableBalance = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(account.availableBalance)),
        symbol: account.symbol,
    }).toString();
    const cappedAmount = BigNumber.min(new BigNumber(amount || 0), availableBalance).toString();

    const resourceOptions = TRON_RESOURCE_TYPES.map(type => {
        const gain = getResourceGain(cappedAmount, type, tronResources);

        return {
            value: type,
            label: (
                <Translation
                    id={RESOURCE_LABEL[type]}
                    values={{ count: gain !== null ? Math.round(gain) : 0 }}
                />
            ),
        };
    });

    return (
        <Column gap={8}>
            <Row gap={4} alignItems="center">
                <Text typographyStyle="body-md">
                    <Translation id="TR_EARN_TRON_RESOURCE_TO_EARN" />
                </Text>
                <Tooltip content={<Translation id="TR_EARN_TRON_RESOURCE_TO_EARN_TOOLTIP" />}>
                    <Icon as={InfoIcon} size={16} />
                </Tooltip>
            </Row>

            <SelectBar
                options={resourceOptions}
                selectedOption={resourceType}
                isDisabled={!!actions.pendingTxid}
                onChange={(value: TronResourceType) => setValue('resourceType', value)}
            />
        </Column>
    );
};
