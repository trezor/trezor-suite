import styled from 'styled-components';

import { CollapsibleBox, Text } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ViewOnlyRadios } from './ViewOnlyRadios';
import { spacingsPx } from '@trezor/theme';
import { useState } from 'react';
import { useDispatch } from 'src/hooks/suite';
import { toggleRememberDevice } from '@suite-common/wallet-core';
import { ContentType } from '../types';
import { AcquiredDevice } from '@suite-common/suite-types';

type ViewOnlyProps = {
    setContentType: (contentType: ContentType) => void;
    instance: AcquiredDevice;
    dataTest?: string;
};

const ViewOnlyContainer = styled.div`
    margin: -16px -12px -12px -8px;
`;
const ViewOnlyContent = styled.div`
    display: flex;
    gap: ${spacingsPx.xs};
    align-items: center;
`;

const Circle = styled.div<{ $isHighlighted?: boolean }>`
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: ${({ $isHighlighted, theme }) =>
        $isHighlighted ? theme.iconPrimaryDefault : theme.iconSubdued};
`;

export const ViewOnly = ({ setContentType, instance, dataTest }: ViewOnlyProps) => {
    const [isViewOnlyExpanded, setIsViewOnlyExpanded] = useState(false);
    const dispatch = useDispatch();

    const isViewOnly = !!instance.remember;

    const handleRememberChange = () => {
        setContentType('default');

        dispatch(
            toggleRememberDevice({
                device: instance,
            }),
        );
    };

    return (
        <ViewOnlyContainer
            onClick={e => {
                e.stopPropagation();
            }}
        >
            <CollapsibleBox
                variant="small"
                filled="none"
                isOpen={isViewOnlyExpanded}
                onCollapse={() => setIsViewOnlyExpanded(!isViewOnlyExpanded)}
                heading={
                    <ViewOnlyContent>
                        <Circle $isHighlighted={isViewOnly} />
                        <Text
                            variant={isViewOnly ? 'secondary' : 'tertiary'}
                            typographyStyle="callout"
                        >
                            {isViewOnly ? (
                                <Translation id="TR_VIEW_ONLY_ENABLED" />
                            ) : (
                                <Translation id="TR_VIEW_ONLY_DISABLED" />
                            )}
                        </Text>
                    </ViewOnlyContent>
                }
            >
                <ViewOnlyRadios
                    isViewOnlyActive={isViewOnly}
                    toggleViewOnly={handleRememberChange}
                    dataTest={`${dataTest}/view-only-radio`}
                />
            </CollapsibleBox>
        </ViewOnlyContainer>
    );
};
