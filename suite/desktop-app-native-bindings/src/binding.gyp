{
  "targets": [
    {
      "target_name": "win_hello",
      "sources": [ "win-hello.cpp", "binding.cpp" ],
      "include_dirs": [
       "<!@(node -p \"require('node-addon-api').include\")",
       "node_modules/node-addon-api",
        "<!(echo %WindowsSdkDir%Include\\%WindowsSDKVersion%\\cppwinrt)",
        "<!(echo %WindowsSdkDir%Include\\%WindowsSDKVersion%\\um)",
        "<!(echo %WindowsSdkDir%Include\\%WindowsSDKVersion%\\shared)"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "library_dirs": [
        "<!(echo %WindowsSdkDir%Lib\\%WindowsSDKVersion%\\um\\x64)"
      ],
      "libraries": [
        "kernel32.lib",
        "user32.lib",
        "ole32.lib",
        "oleaut32.lib"
      ],
      "cflags_cc": [ "/std:c++20", "/await", "/EHsc" ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "WINRT_LEAN_AND_MEAN",
        "_ENABLE_EXTENDED_ALIGNED_STORAGE"
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "AdditionalOptions": [ "/std:c++20", "/await", "/EHsc" ]
        }
      }
    }
  ]
}
