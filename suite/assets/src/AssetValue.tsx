import { useFormatters } from '@suite-common/formatters';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AmountUnit } from '@suite-common/wallet-utils';

import { AssetSymbol } from './AssetSymbol';

type AssetValueProps = {
    amount: AmountUnit;
    networkSymbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

/** An amount of a coin or a token; an unrecognized token's symbol has its URLs masked. */
export const AssetValue = ({ amount, networkSymbol, contractAddress }: AssetValueProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    return (
        <>
            {/* The amount is already in main units, and the symbol is rendered as a component. */}
            <CryptoAmountFormatter
                value={amount.toFixed()}
                smallestUnitsOverride={false}
                withSymbol={false}
            />{' '}
            <AssetSymbol networkSymbol={networkSymbol} contractAddress={contractAddress} />
        </>
    );
};
