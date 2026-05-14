import { type IconName, InfoItem } from '@trezor/components';
import { capitalizeFirstLetter } from '@trezor/utils';

type MessageSystemConditionProps<T extends Record<string, unknown>> = {
    label: string;
    iconName: IconName;
    data?: T | readonly T[] | null;
};

export const MessageSystemCondition = <T extends Record<string, unknown>>({
    label,
    iconName,
    data,
}: MessageSystemConditionProps<T>) => {
    // eslint-disable-next-line no-nested-ternary
    const list: ReadonlyArray<T> = data == null ? [] : Array.isArray(data) ? data : [data];

    return (
        <InfoItem label={label} iconName={iconName} intent="neutral" priority="primary">
            {list.length === 0
                ? '-'
                : list.flatMap((item, i) =>
                      Object.entries(item).map(([key, value]) => (
                          <InfoItem
                              key={`${i}-${key}`}
                              label={capitalizeFirstLetter(key)}
                              direction="row"
                          >
                              {String(value)}
                          </InfoItem>
                      )),
                  )}
        </InfoItem>
    );
};
