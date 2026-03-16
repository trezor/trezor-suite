import { useState } from 'react';

import { GhostContainer } from '@trezor/components';

import { Fees, type FeesProps } from 'src/components/wallet/Fees/Fees';

export type TradingFormFeesProps = Pick<
    FeesProps,
    'feeInfo' | 'account' | 'composedLevels' | 'changeFeeLevel'
>;

export const TradingFormFees = ({
    feeInfo,
    account,
    composedLevels,
    changeFeeLevel,
}: TradingFormFeesProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <GhostContainer
            padding={{ horizontal: 20, vertical: 12 }}
            borderRadius={0}
            onClick={() => {
                setIsOpen(!isOpen);
                if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                }
            }}
            cursor="pointer"
            isActive={isOpen}
        >
            <Fees
                feeInfo={feeInfo}
                account={account}
                composedLevels={composedLevels}
                changeFeeLevel={changeFeeLevel}
                isOpen={isOpen}
            />
        </GhostContainer>
    );
};
