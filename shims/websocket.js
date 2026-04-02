// WebSocket shim for @supabase/realtime-js
// React Native provides WebSocket globally — this replaces the Node.js 'ws' package
// that @supabase/realtime-js tries to require in non-browser environments.

const WS = typeof WebSocket !== 'undefined' ? WebSocket : global.WebSocket;

module.exports = WS;
module.exports.default = WS;
module.exports.WebSocket = WS;
