import { FormProvider, useWatch } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { Banner, Card, Column, Divider, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeFees } from '../TronStakeFees';
import { TronStakePendingTransaction } from '../TronStakePendingTransaction';
import { TronUnstakeAmount } from './TronUnstakeAmount';
import { TronUnstakeResourceReduction } from './TronUnstakeResourceReduction';
import { TronUnstakeResourceSelect } from './TronUnstakeResourceSelect';
import { TronUnstakeSubmitButton } from './TronUnstakeSubmitButton';

export const TronUnstakeForm = () => {
    const { form, actions } = useTronStakeContext();
    const { error } = actions;

    const amount = useWatch({ control: form.methods.control, name: 'amount' });
    const showReduction = new BigNumber(amount || 0).gt(0);

    return (
        <FormProvider {...form.methods}>
            <Column gap={16}>
                <Column gap={4}>
                    <Text typographyStyle="headline-md">
                        <Translation id="TR_EARN_TRON_UNSTAKE_TITLE" />
                    </Text>
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation id="TR_EARN_TRON_UNSTAKE_DESCRIPTION" />
                    </Text>
                </Column>

                <Card paddingType="none">
                    <Column gap={16} padding={{ vertical: 16 }}>
                        <Column padding={{ horizontal: 20 }}>
                            <TronUnstakeResourceSelect />
                        </Column>
                        <Divider margin={{ top: 0, bottom: 0 }} />
                        <Column padding={{ horizontal: 20 }}>
                            <TronUnstakeAmount />
                        </Column>
                        {showReduction && (
                            <>
                                <Divider margin={{ top: 0, bottom: 0 }} />
                                <Column padding={{ horizontal: 20 }}>
                                    <TronUnstakeResourceReduction />
                                </Column>
                            </>
                        )}
                    </Column>
                </Card>

                <TronStakeFees />

                {error && (
                    <Banner
                        intent="warning"
                        description={<Translation id="TR_EARN_TRON_SUBMIT_ERROR" />}
                    />
                )}

                <TronUnstakeSubmitButton />

                <TronStakePendingTransaction
                    title={<Translation id="TR_EARN_TRON_PENDING_UNSTAKE" />}
                />
            </Column>
        </FormProvider>
    );
};
