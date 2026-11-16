import { Column } from '@trezor/components';

import { CoinSelectionOption } from './sendOptions/CoinSelectionOption';
import { DataOption } from './sendOptions/DataOption';
import { LocktimeOption } from './sendOptions/LocktimeOption';
import { MemoOption } from './sendOptions/MemoOption';
import { NonceOption } from './sendOptions/NonceOption';
import { RecipientActions } from './sendOptions/RecipientActions';
import { useSendOptions } from './sendOptions/useSendOptions';

/**
 * The send options the network offers, each rendered by its own component that depends only on
 * that option's contract. Nothing here asks which network it is on.
 */
export const Options = () => {
    const { family, options, transfer } = useSendOptions();
    const { memo, data, nonce } = options;

    return (
        <Column gap={16}>
            <RecipientActions
                recipients={options.recipients}
                hasCoinSelection={options.coinSelection === true}
            />
            {memo && !memo.identifiesRecipient && <MemoOption memo={memo} />}
            {data && <DataOption data={data} transfer={transfer} />}
            {nonce && <NonceOption nonce={nonce} family={family} />}
            {options.locktime && <LocktimeOption />}
            {options.coinSelection && <CoinSelectionOption />}
        </Column>
    );
};
