// Must be the very first import so URL is polyfilled before any Supabase code runs
import 'react-native-url-polyfill/auto';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
