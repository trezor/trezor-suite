import styled from 'styled-components';

import { CollapsibleBox, Text, Row } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { ViewOnlyRadios } from './ViewOnlyRadios';
import { spacings, spacingsPx } from '@trezor/theme';
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
    padding: 0 ${spacingsPx.xxs} ${spacingsPx.xxs};
`;

const Circle = styled.div<{ $isHighlighted?: boolean }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $isHighlighted, theme }) =>
        $isHighlighted ? theme.iconPrimaryDefault : theme.iconSubdued};
`;

export const ViewOnly = ({ setContentType, instance }: ViewOnlyProps) => {
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
                paddingType="none"
                heading={
                    <Row gap={spacings.xs}>
                        <Circle $isHighlighted={isViewOnly} />
                        <Text
                            variant={isViewOnly ? 'secondary' : 'tertiary'}
                            typographyStyle="callout"
                        >
                            <Translation
                                id={isViewOnly ? 'TR_VIEW_ONLY_ENABLED' : 'TR_VIEW_ONLY_DISABLED'}
                            />
                        </Text>
                    </Row>
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
