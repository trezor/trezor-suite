import { useState } from 'react';

import { CollapsibleBox, Link, Text } from '@trezor/components';

import { BluetoothTips } from './BluetoothTips';

type NotTrezorYouAreLookingForProps = {
    onReScanClick: () => void;
};

export const NotTrezorYouAreLookingFor = ({ onReScanClick }: NotTrezorYouAreLookingForProps) => {
    const [showTips, setShowTips] = useState(false);

    return (
        <CollapsibleBox
            fillType="none"
            paddingType="none"
            headingSize="medium"
            toggleIconName="chevronDown"
            heading={
                <Link typographyStyle="hint" variant="underline" onClick={() => setShowTips(true)}>
                    <Text variant="tertiary">Not the Trezor you’re looking for?</Text>
                </Link>
            }
        >
            {showTips && (
                <BluetoothTips onReScanClick={onReScanClick} header="Check tips & try again" />
            )}
        </CollapsibleBox>
    );
};
