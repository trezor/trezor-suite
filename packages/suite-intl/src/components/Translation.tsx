import React from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';
import { messages } from '@suite/messages';

export type TranslationProps = {
    isNested?: boolean;
    isReactNative?: boolean; // used to render span on the web, plain node for react-native
    translationTooltip?: React.ComponentType<TooltipProps>;
} & ExtendedMessageDescriptor;

export interface TooltipProps {
    isNested?: boolean;
    messageId: keyof typeof messages;
    children: any;
}

type PrimitiveType = string | number | boolean | Date | null | undefined;

// Add MessageDescriptor type to values entry
type FormatXMLElementFn = (...args: any[]) => string | object;
export interface ExtendedMessageDescriptor extends MessageDescriptor {
    id: keyof typeof messages;
    values?: {
        [key: string]:
            | PrimitiveType
            | React.ReactElement
            | ExtendedMessageDescriptor
            | FormatXMLElementFn;
    };
}

export const isMsgType = (props: TranslationProps | React.ReactNode): props is TranslationProps =>
    typeof props === 'object' && props !== null && (props as TranslationProps).id !== undefined;

const RenderChildrenComponent = ({ children }: any) => children;

export const Translation = (props: TranslationProps) => {
    // Tooltip is only used in suite-landing-page, in case landing will be moved to eshop this could be removed
    const TooltipComponent = props.translationTooltip ?? RenderChildrenComponent;
    const values: Record<string, PrimitiveType | React.ReactNode | ExtendedMessageDescriptor> = {};
    // message passed via props (id, defaultMessage, values)
    Object.keys(props.values || []).forEach(key => {
        // Iterates through all values. The entry may also contain a MessageDescriptor.
        // If so, Renders MessageDescriptor by passing it to `Translation` component
        const maybeMsg = props.values![key];
        values[key] = isMsgType(maybeMsg) ? (
            <Translation {...maybeMsg} translationTooltip={props.translationTooltip} isNested />
        ) : (
            maybeMsg
        );
    });

    // prevent runtime errors
    if (
        !props.defaultMessage &&
        Object.prototype.hasOwnProperty.call(props, 'id') &&
        !messages[props.id]
    ) {
        return <>{`Unknown translation id: ${props.id}`}</>;
    }

    const defaultTagName = props.isReactNative || props.isNested ? undefined : 'span';

    return (
        <TooltipComponent isNested={props.isNested} messageId={props.id}>
            <FormattedMessage
                id={props.id}
                tagName={defaultTagName}
                defaultMessage={props.defaultMessage || messages[props.id].defaultMessage}
                // pass undefined to a 'values' prop in case of an empty values object
                values={Object.keys(values).length === 0 ? undefined : values}
            />
        </TooltipComponent>
    );
};
