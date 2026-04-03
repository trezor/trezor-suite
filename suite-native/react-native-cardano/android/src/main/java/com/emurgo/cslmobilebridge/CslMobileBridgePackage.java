package com.emurgo.cslmobilebridge;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.HashMap;

/**
 * Empty package required by React Native autolinking.
 *
 * The actual CslMobileBridge TurboModule is a pure C++ module registered
 * via the autolinking cxxModuleProvider (see CMakeLists.txt). This Java
 * class exists only so that the CLI's findPackageClassName() succeeds
 * when build.gradle is present (needed to package pre-compiled jniLibs).
 */
public class CslMobileBridgePackage extends TurboReactPackage {

    @Override
    public NativeModule getModule(String name, ReactApplicationContext reactContext) {
        return null;
    }

    @Override
    public ReactModuleInfoProvider getReactModuleInfoProvider() {
        return HashMap::new;
    }
}
