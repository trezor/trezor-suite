import React from 'react';
import { Translation } from '@suite-components';
import GreyCard from '../GreyCard';
import WarnHeader from '../WarnHeader';

const NoChange = () => (
    <GreyCard>
        <WarnHeader>
            <Translation id="TR_NO_CHANGE_OUTPUT" />
        </WarnHeader>
        {/* <select>
                <option>Add another utxo</option>
            </select> */}
    </GreyCard>
);

export default NoChange;
