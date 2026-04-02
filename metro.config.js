const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// ─── Fix: @supabase/realtime-js imports the Node.js 'ws' package ─────────────
// React Native ships its own global WebSocket, so we shim 'ws' with our
// thin wrapper that re-exports the global. Without this Metro throws:
//   "Unable to resolve module 'ws' from node_modules/@supabase/realtime-js"
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ws') {
    return {
      filePath: path.resolve(__dirname, 'shims/websocket.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
