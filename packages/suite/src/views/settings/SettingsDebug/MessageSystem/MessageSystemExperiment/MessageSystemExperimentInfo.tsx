import { ExperimentsItemType } from '@suite-common/message-system';
import { Column, Icon, InfoItem } from '@trezor/components';
import { spacings } from '@trezor/theme';

type MessageSystemExperimentInfoProps = {
    assignedGroup?: ExperimentsItemType['groups'][number];
    isActive: boolean;
    inclusion: number | null;
};

export const MessageSystemExperimentInfo = ({
    assignedGroup,
    isActive,
    inclusion,
}: MessageSystemExperimentInfoProps) => (
    <Column gap={spacings.xs}>
        <InfoItem label="Active" iconName="info" direction="row">
            <Icon name="circleFilled" variant={isActive ? 'primary' : 'destructive'} />
        </InfoItem>

        <InfoItem label="Assigned group" iconName="users" direction="row">
            {assignedGroup ? assignedGroup.variant : 'N/A'}
        </InfoItem>

        <InfoItem label="Inclusion" iconName="crosshair" direction="row">
            {inclusion !== null ? inclusion : 'N/A'}
        </InfoItem>
    </Column>
);
