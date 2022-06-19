import React from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';
import { MessagesObject } from './messages';

// Use this type for project specific Translation components props
export type TranslationProps<TMessageId extends string> = {
    isNested?: boolean;
} & ExtendedMessageDescriptor<TMessageId>;

export type BaseTranslationProps<TMessageId extends string> = {
    isReactNative?: boolean; // used to render span on the web, plain node for react-native
    translationTooltip?: React.ComponentType<TooltipProps<TMessageId>>;
    messages: MessagesObject<TMessageId>;
} & TranslationProps<TMessageId>;

export interface TooltipProps<TMessageId extends string> {
    isNested?: boolean;
    messageId: TMessageId;
    children: any;
}

export type MessageValuesValue = string | number | boolean | Date | null | undefined;

// Add MessageDescriptor type to values entry
type FormatXMLElementFn = (...args: any[]) => string | object;
export interface ExtendedMessageDescriptor<TMessageId extends string> extends MessageDescriptor {
    id: TMessageId;
    values?: {
        [key: string]:
            | MessageValuesValue
            | React.ReactElement
            | ExtendedMessageDescriptor<TMessageId>
            | FormatXMLElementFn;
    };
}

const isMsgType = <TMessageId extends string>(
    props: BaseTranslationProps<TMessageId> | React.ReactNode,
): props is BaseTranslationProps<TMessageId> =>
    typeof props === 'object' &&
    props !== null &&
    (props as BaseTranslationProps<TMessageId>).id !== undefined;

const RenderChildrenComponent = ({ children }: any) => children;

export const BaseTranslation = <TMessageId extends string>(
    props: BaseTranslationProps<TMessageId>,
) => {
    // Tooltip is only used in suite-landing-page, in case landing will be moved to eshop this could be removed
    const TooltipComponent = props.translationTooltip ?? RenderChildrenComponent;
    const values: Record<
        string,
        MessageValuesValue | React.ReactNode | ExtendedMessageDescriptor<TMessageId>
    > = {};
    // message passed via props (id, defaultMessage, values)
    Object.keys(props.values || []).forEach(key => {
        // Iterates through all values. The entry may also contain a MessageDescriptor.
        // If so, Renders MessageDescriptor by passing it to `BaseTranslation` component
        const maybeMsg = props.values![key];
        values[key] = isMsgType(maybeMsg) ? (
            <BaseTranslation<TMessageId>
                {...maybeMsg}
                translationTooltip={props.translationTooltip}
                isNested
                messages={props.messages}
            />
        ) : (
            maybeMsg
        );
    });

    // prevent runtime errors
    if (
        !props.defaultMessage &&
        Object.prototype.hasOwnProperty.call(props, 'id') &&
        !props.messages[props.id]
    ) {
        return <>{`Unknown translation id: ${props.id}`}</>;
    }

    const defaultTagName = props.isReactNative || props.isNested ? undefined : 'span';

    return (
        <TooltipComponent isNested={props.isNested} messageId={props.id}>
            <FormattedMessage
                id={props.id}
                tagName={defaultTagName}
                defaultMessage={props.defaultMessage || props.messages[props.id].defaultMessage}
                // pass undefined to a 'values' prop in case of an empty values object
                values={Object.keys(values).length === 0 ? undefined : values}
            />
        </TooltipComponent>
    );
};
