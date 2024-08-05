import React, { useState } from 'react';
import styled from 'styled-components';
import { isDesktop } from '@trezor/env-utils';
import { selectTorState } from 'src/reducers/suite/suiteReducer';
import { useSelector } from 'react-redux';
import { CheckIcon } from './CheckIcon';

const TorToggleContainer = styled.div`
    position: relative;
    width: 100%;
`;

type TorContainerWithCheckIconProps = {
    children?: React.ReactNode;
};

export const TorContainerWithCheckIcon = ({ children }: TorContainerWithCheckIconProps) => {
    const { isTorEnabled } = useSelector(selectTorState);
    const isTorIconVisible = isDesktop();
    const [isTorContainerHoveredOrFocused, setIsTorContainerHoveredOrFocused] = useState(false);

    const onTorContainerChange = (value: boolean) => () => setIsTorContainerHoveredOrFocused(value);

    if (isTorIconVisible) {
        return (
            <TorToggleContainer
                onMouseEnter={onTorContainerChange(true)}
                onMouseLeave={onTorContainerChange(false)}
                onFocus={onTorContainerChange(true)}
                onBlur={onTorContainerChange(false)}
            >
                {children}
                {isTorEnabled && (
                    <CheckIcon isTorContainerHoveredOrFocused={isTorContainerHoveredOrFocused} />
                )}
            </TorToggleContainer>
        );
    }

    return <></>;
};
