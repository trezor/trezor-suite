// this is idiotic, but flow doesn't work otherwise
// (I can also add whole node_modules, but that takes FOREVER)


declare module 'whatwg-fetch' {
}

declare module 'socket.io-client' {
  declare var exports: any;
}
