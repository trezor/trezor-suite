import { InfoItem, type InfoItemProps, Text } from '@trezor/components';

export const TxDetailItem = ({ label, icon, children }: Partial<InfoItemProps>) => (
    <InfoItem
        label={label}
        icon={icon}
        labelWidth={135}
        typographyStyle="body-xs"
        direction="row"
        verticalAlignment="start"
        ellipsisLineCount={2}
    >
        <Text as="div" typographyStyle="body-xs">
            {children}
        </Text>
    </InfoItem>
);
