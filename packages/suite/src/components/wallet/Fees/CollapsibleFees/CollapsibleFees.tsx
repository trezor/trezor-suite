import { useFormContext } from 'react-hook-form';

import { type FormState } from '@suite-common/wallet-types';
import { Collapsible } from '@trezor/components';

import { type Account } from 'src/types/wallet';

import {
    CollapsibleFeesHeaderContent,
    type CollapsibleFeesHeaderContentProps,
} from './CollapsibleFeesHeaderContent';
import { FeeLevels } from './FeeLevels/FeeLevels';
import { FeesContext, type FeesContextType } from '../context/FeesContext';
import { useFeeLevels } from './FeeLevels/useFeeLevels';
import { useFeesContextValue } from '../context/useFeesContextValue';

export type CollapsibleFeesProps = {
    account: Pick<Account, 'symbol' | 'networkType' | 'misc'>;
    rbfForm?: boolean;
    isOpen?: boolean;
} & Pick<FeesContextType, 'feeInfo' | 'composedLevels' | 'changeFeeLevel'> &
    Omit<CollapsibleFeesHeaderContentProps, 'supportsAdjustableFees' | 'txMaxFee' | 'isOpen'>;

export function CollapsibleFees({
    account,
    label,
    feeInfo,
    composedLevels,
    changeFeeLevel,
    rbfForm,
    headerTypographyStyle = 'body-md',
    isOpen,
}: CollapsibleFeesProps) {
    const { control } = useFormContext<FormState>();
    const fees = useFeesContextValue({
        account,
        control,
        feeInfo,
        composedLevels,
        changeFeeLevel,
    });
    const { supportsAdjustableFees, txMaxFee } = useFeeLevels(fees);

    return (
        <FeesContext.Provider value={fees}>
            <Collapsible gap={12} isOpen={isOpen} data-testid="@wallet/fees/collapsible-fees">
                <CollapsibleFeesHeaderContent
                    label={label}
                    headerTypographyStyle={headerTypographyStyle}
                    supportsAdjustableFees={supportsAdjustableFees}
                    txMaxFee={txMaxFee}
                    isOpen={isOpen}
                />

                {supportsAdjustableFees && (
                    <Collapsible.Content overflow="unset" onClick={ev => ev.stopPropagation()}>
                        <FeeLevels showCurrentFee={!rbfForm} />
                    </Collapsible.Content>
                )}
            </Collapsible>
        </FeesContext.Provider>
    );
}
