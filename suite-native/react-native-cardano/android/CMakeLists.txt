cmake_minimum_required(VERSION 3.13)
project(csl_mobile_bridge_jsi)

set(CMAKE_CXX_STANDARD 20)

# Find the csl-mobile-bridge package (for C++ sources)
execute_process(
    COMMAND node --print "require.resolve('@emurgo/csl-mobile-bridge/package.json').replace('/package.json', '')"
    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    OUTPUT_VARIABLE CSL_BRIDGE_DIR
    OUTPUT_STRIP_TRAILING_WHITESPACE
)

# C++ TurboModule bridge (compiled from csl-mobile-bridge source)
add_library(${PROJECT_NAME} SHARED
    ${CSL_BRIDGE_DIR}/cpp/NativeCslMobileBridgeModule.cpp
)

# Pre-compiled Rust shared library — shipped via jniLibs, loaded at runtime.
# Use target_link_directories (PUBLIC) so the search path propagates to appmodules,
# and -l flag records just the basename in DT_NEEDED, not the absolute host path.
target_link_directories(${PROJECT_NAME} PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}
)

target_include_directories(${PROJECT_NAME} PUBLIC
    ${CSL_BRIDGE_DIR}/cpp
    ${CMAKE_CURRENT_SOURCE_DIR}/src/main/cpp
    # Codegen-generated headers (RNCslMobileBridgeSpecJSI.h)
    ${CMAKE_CURRENT_SOURCE_DIR}/build/generated/source/codegen/jni
    ${CMAKE_CURRENT_SOURCE_DIR}/build/generated/source/codegen/jni/react/renderer/components/RNCslMobileBridgeSpec
)

# Uses alias targets provided by the parent ReactNative-application.cmake:
#   jsi       = ReactAndroid::jsi
#   fbjni     = fbjni::fbjni
#   reactnative = ReactAndroid::reactnative
target_link_libraries(${PROJECT_NAME}
    react_native_haskell_shelley
    fbjni
    jsi
    reactnative
    android
    log
)
