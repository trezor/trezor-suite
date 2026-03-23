import { type ReactNode } from 'react';

import { CollapsibleBox } from '@trezor/components';

import { IOGroup, type IOGroupProps } from './IOGroup';

type CollapsibleIOSectionProps = IOGroupProps & {
    heading?: ReactNode;
    opened?: boolean;
};

export const CollapsibleIOSection = ({
    tx,
    inputs,
    outputs,
    heading,
    opened,
    isPhishingTransaction,
}: CollapsibleIOSectionProps) =>
    inputs?.length || outputs?.length ? (
        <CollapsibleBox
            heading={heading}
            defaultIsOpen={opened}
            paddingType="none"
            fillType="none"
            hasDivider={false}
        >
            <IOGroup
                tx={tx}
                inputs={inputs}
                outputs={outputs}
                isUtxoBased
                isPhishingTransaction={isPhishingTransaction}
            />
        </CollapsibleBox>
    ) : null;
