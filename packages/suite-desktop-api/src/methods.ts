export type StrictChannel = { [name: string]: any };

// Find undefined in union `string | undefined`
export type ExtractUndefined<U> = (U extends undefined ? (k: U) => void : never) extends (
    k: infer I,
) => void
    ? I
    : never;

type Listener<Payload, Event> = Event extends null
    ? [Payload] extends [void]
        ? () => void
        : (payload: Payload) => void
    : [Payload] extends [void]
      ? (event: Event) => void
      : (event: Event, payload: Payload) => void;

type ListenerArgs<Channels extends StrictChannel, Event, C extends keyof Channels> = {
    [K in C]: [channel: K, listener: Listener<Channels[K], Event>];
}[C];

type PayloadArgs<Payload> = [Payload] extends [void]
    ? []
    : undefined extends Payload
      ? [payload?: Payload]
      : [payload: Payload];

type SendArgs<Channel, Payload, Event> = Event extends null
    ? PayloadArgs<Payload>
    : [channel: Channel, ...PayloadArgs<Payload>];

type SendWithChannelArgs<Channels extends StrictChannel, Event, C extends keyof Channels> = {
    [K in C]: SendArgs<K, Channels[K], Event>;
}[C];

type InvokeArgs<Channel, Method, Event> = Method extends (...args: infer Args) => any
    ? Event extends null
        ? Args
        : [channel: Channel, ...Args]
    : never;

type InvokeResult<Method> = Method extends (...args: any[]) => infer Result ? Result : never;

type InvokeWithChannelArgs<Channels extends StrictChannel, Event, C extends keyof Channels> = {
    [K in C]: InvokeArgs<K, Channels[K], Event>;
}[C];

type SendWithoutChannel<Channels extends StrictChannel> = {
    [C in keyof Channels]: (...args: PayloadArgs<Channels[C]>) => void;
}[keyof Channels];

type InvokeWithoutChannel<Channels extends StrictChannel> = {
    [C in keyof Channels]: (
        ...args: InvokeArgs<C, Channels[C], null>
    ) => Promise<InvokeResult<Channels[C]>>;
}[keyof Channels];

type Handler<Method, Event> = Method extends (...args: infer Args) => infer Result
    ? Event extends null
        ? (...args: Args) => Result | Promise<Result>
        : (event: Event, ...args: Args) => Result | Promise<Result>
    : never;

type HandleArgs<Channels extends StrictChannel, Event, C extends keyof Channels> = {
    [K in C]: [channel: K, handler: Handler<Channels[K], Event>];
}[C];

/**
 * Listener method maps a channel to its payload without materializing an overload intersection.
 * If generic type <E> is not set, the first listener parameter "event" will be omitted.
 *
 * usage DesktopApi.on -> ipcRenderer.on:
 * type Fn = ListenerMethod<{'foo': number, 'bar': string }>
 * accepts Fn('foo', (payload: number) => {}) and Fn('bar', (payload: string) => {})
 *
 * usage ipcMain.on:
 * type Fn = ListenerMethod<{'foo': number, 'bar': string }, Event>
 * accepts Fn('foo', (event: Event, payload: number) => {}) and Fn('bar', (event: Event, payload: string) => {})
 */
export type ListenerMethod<Channels extends StrictChannel, E = null> = <C extends keyof Channels>(
    ...args: ListenerArgs<Channels, E, C>
) => void;

/**
 * Send method maps a channel to its payload without materializing an overload intersection.
 * If generic type <E> is not set, the first parameter "channel" will be omitted.
 *
 * usage: DesktopApi.[method] > ipcRenderer.send
 * type Fn = SendMethod<{'foo': number, 'bar': string | undefined, 'xyz': void }>
 * creates a method matching the payload of its single channel.
 *
 * usage: webContents.send
 * type Fn = SendMethod<{'foo': number, 'bar': string | undefined, 'xyz': void }, Event>
 * accepts Fn('foo', 1), Fn('bar'), and Fn('xyz').
 */
export type SendMethod<Channels extends StrictChannel, E = null> = E extends null
    ? SendWithoutChannel<Channels>
    : <C extends keyof Channels>(...args: SendWithChannelArgs<Channels, E, C>) => void;

/**
 * Invoke method maps a channel to its arguments and result without materializing an overload
 * intersection. If generic type <E> is not set, the first parameter "channel" will be omitted.
 *
 * usage in DesktopApi.[method] definition:
 * type Fn = InvokeMethod<{'foo': () => void, 'bar': (arg: number) => { success: boolean } }>;
 * creates a method matching the arguments and result of its single channel.
 *
 * usage in ipcRenderer.invoke:
 * type Fn = InvokeMethod<{'foo': () => void, 'bar': (arg1: number, arg2: boolean) => { success: boolean } }, Electron.IpcMainInvokeEvent>;
 * accepts Fn('foo') and Fn('bar', 1, true), preserving the corresponding result type.
 */
export type InvokeMethod<Channels extends StrictChannel, E = null> = E extends null
    ? InvokeWithoutChannel<Channels>
    : <C extends keyof Channels>(
          ...args: InvokeWithChannelArgs<Channels, E, C>
      ) => Promise<InvokeResult<Channels[C]>>;

/**
 * Handle method maps a channel to its handler without materializing an overload intersection.
 * If generic type <E> is not set, the first handler parameter "event" will be omitted.
 *
 * usage in ipcMain.handle:
 * type Fn = HandleMethod<{'foo': () => void, 'bar': (arg1: number, arg2: boolean) => { success: boolean } }, Electron.IpcMainInvokeEvent>;
 * accepts handlers whose arguments and result correspond to the selected channel.
 */
export type HandleMethod<Channels extends StrictChannel, E = null> = <C extends keyof Channels>(
    ...args: HandleArgs<Channels, E, C>
) => void;
