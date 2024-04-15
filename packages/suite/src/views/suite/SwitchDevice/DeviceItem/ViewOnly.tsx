import styled, { useTheme } from 'styled-components';

import { CollapsibleBox, Text, Tooltip, Icon } from '@trezor/components';
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

const EjectContainer = styled.div`
    position: absolute;
    right: ${spacingsPx.sm};
    top: ${spacingsPx.sm};
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
    const theme = useTheme();
    const isViewOnly = !!instance.remember;

    const handleRememberChange = (value: boolean) => {
        setContentType('default');
        setIsViewOnlyExpanded(false);

        dispatch(
            toggleRememberDevice({
                device: instance,
                forceRemember: value === true ? true : undefined,
            }),
        );
    };

    return (
        <>
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
                        setIsViewOnlyActive={handleRememberChange}
                        dataTest={`${dataTest}/view-only-radio`}
                    />
                </CollapsibleBox>
            </ViewOnlyContainer>

            <EjectContainer>
                <Tooltip hasArrow cursor="pointer" content={<Translation id="TR_EJECT_HEADING" />}>
                    <Icon
                        data-test={`${dataTest}/eject-button`}
                        icon="EJECT"
                        size={22}
                        color={theme.TYPE_LIGHT_GREY}
                        hoverColor={theme.TYPE_DARK_GREY}
                        onClick={e => {
                            setContentType('ejectConfirmation');
                            e.stopPropagation();
                        }}
                    />
                </Tooltip>
            </EjectContainer>
        </>
    );
};
