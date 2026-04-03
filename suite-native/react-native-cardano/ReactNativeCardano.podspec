require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# Absolute path for HEADER_SEARCH_PATHS (compiler flag — works with absolute paths).
csl_bridge_abs = File.dirname(
  `node --print "require.resolve('@emurgo/csl-mobile-bridge/package.json')"`.strip
)

Pod::Spec.new do |s|
  s.name         = 'ReactNativeCardano'
  s.version      = package['version']
  s.summary      = 'Pre-compiled Cardano serialization library for React Native'
  s.homepage     = 'https://github.com/trezor/trezor-suite'
  s.license      = package['license']
  s.author       = 'SatoshiLabs'
  s.platforms    = { :ios => '15.1' }
  s.source       = { :git => 'https://github.com/trezor/trezor-suite.git', :tag => s.version }

  # C++ TurboModule glue copied from @emurgo/csl-mobile-bridge by
  # scripts/postinstall.sh. Must live inside the pod root — CocoaPods
  # dev-pods silently drop source_files outside the pod directory.
  s.source_files = [
    'ios/csl_cpp/**/*.{h,hpp,cpp,c}',
    'ios/csl_ios/**/*.{h,m,mm}',
  ]

  # Pre-compiled Rust static library
  s.vendored_frameworks = 'ios/build/CslMobileBridge.xcframework'

  s.pod_target_xcconfig = {
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    'ENABLE_BITCODE' => 'NO',
    'HEADER_SEARCH_PATHS' => "\"#{csl_bridge_abs}/rust/include\"",
  }

  install_modules_dependencies(s)
end
