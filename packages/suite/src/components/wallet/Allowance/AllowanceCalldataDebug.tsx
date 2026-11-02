import { useSelector } from 'react-redux';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { CollapsibleBox, Text } from '@trezor/components';
import { CaretDownIcon } from '@trezor/icons';

type AllowanceCalldataDebugProps = {
    data: string;
};

export const AllowanceCalldataDebug = ({ data }: AllowanceCalldataDebugProps) => {
    const isDebug = useSelector(selectIsDebugModeActive);

    if (!isDebug) {
        return null;
    }

    return (
        <CollapsibleBox
            heading={
                <Text typographyStyle="body-sm">
                    <DebugOnlyBadge>
                        <Translation id="TR_APPROVAL_DATA" />
                    </DebugOnlyBadge>
                </Text>
            }
            toggleIcon={CaretDownIcon}
            toggleIconSize={20}
        >
            <Text wordBreak="break-all" isMonospaced>
                {data}
            </Text>
        </CollapsibleBox>
    );
};
