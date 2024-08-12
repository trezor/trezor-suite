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
    'data-testid'?: string;
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

export const ViewOnly = ({ setContentType, instance }: ViewOnlyProps) => {
    const [isViewOnlyExpanded, setIsViewOnlyExpanded] = useState(false);
    const dispatch = useDispatch();

    const isViewOnly = !!instance.remember;

    const handleRememberChange = () => {
        setContentType('default');
        dispatch(toggleRememberDevice({ device: instance }));
    };

    return (
        <ViewOnlyContainer
            data-testid={`@viewOnlyStatus/${isViewOnly ? 'enabled' : 'disabled'}`}
            onClick={e => {
                e.stopPropagation();
            }}
        >
            <CollapsibleBox
                fillType="none"
                hasDivider={false}
                isOpen={isViewOnlyExpanded}
                onToggle={() => setIsViewOnlyExpanded(!isViewOnlyExpanded)}
                heading={
                    <ViewOnlyContent>
                        <Circle $isHighlighted={isViewOnly} />
                        <Text
                            variant={isViewOnly ? 'secondary' : 'tertiary'}
                            typographyStyle="callout"
                        >
                            <Translation
                                id={isViewOnly ? 'TR_VIEW_ONLY_ENABLED' : 'TR_VIEW_ONLY_DISABLED'}
                            />
                        </Text>
                    </ViewOnlyContent>
                }
            >
                <ViewOnlyRadios
                    isViewOnlyActive={isViewOnly}
                    toggleViewOnly={handleRememberChange}
                    data-testid="@viewOnly/radios"
                    setContentType={setContentType}
                    device={instance}
                />
            </CollapsibleBox>
        </ViewOnlyContainer>
    );
};
