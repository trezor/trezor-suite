import { selectAreFeesLoading } from '@suite-common/wallet-core';
import { calculateTronFeeBreakdown } from '@suite-common/wallet-utils';
import { LoadingContent } from '@trezor/components';
import { type TypographyStyle } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

import { TronFeeContent } from './TronFeeContent';
import { useFeesContext } from '../../context/FeesContext';

type TronFeeProps = {
    typographyStyle: TypographyStyle;
};

export function TronFee({ typographyStyle }: TronFeeProps) {
    const { networkSymbol, composedLevels, tronResources } = useFeesContext();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, networkSymbol));

    const tx = composedLevels?.normal;
    const fees = calculateTronFeeBreakdown(tx, tronResources, networkSymbol);

    return (
        <LoadingContent
            size={20}
            isLoading={areFeesLoading}
            data-testid="@wallet/tron-fee-loading"
            slideContent={false}
        >
            <TronFeeContent
                tx={tx}
                fees={fees}
                networkSymbol={networkSymbol}
                typographyStyle={typographyStyle}
            />
        </LoadingContent>
    );
}
