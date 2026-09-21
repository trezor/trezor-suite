import { IconButton } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';

type CopyButtonProps = {
    value: string;
};

export const CopyButton = ({ value }: CopyButtonProps) => {
    const copyToClipboard = useCopyToClipboard();

    return <IconButton iconName="copy" size="small" onPress={() => copyToClipboard(value)} />;
};
