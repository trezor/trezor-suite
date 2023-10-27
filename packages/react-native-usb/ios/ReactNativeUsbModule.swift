import ExpoModulesCore

// This file is mostly empty because we doesn't support iOS/Mac (yet).

public class ReactNativeUsbModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ReactNativeUsb')` in JavaScript.
    Name("ReactNativeUsb")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    // Constants([
    //   "PI": Double.pi
    // ])

    // Defines event names that the module can send to JavaScript.
    // Events("onChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    // Function("hello") {
    //   return "Hello world! 👋"
    // }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    // AsyncFunction("setValueAsync") { (value: String) in
    //   // Send an event to JavaScript.
    //   self.sendEvent("onChange", [
    //     "value": value
    //   ])
    // }
  }
}
