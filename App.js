// react-native-url-polyfill must be imported first (also imported in index.js,
// keeping it here as a safety net for any alternative entry points)
import 'react-native-url-polyfill/auto';

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import BrowseScreen from './src/screens/BrowseScreen';
import PostScreen from './src/screens/PostScreen';
import AdminScreen from './src/screens/AdminScreen';

const Tab = createBottomTabNavigator();

function BLRRealtyLogo() {
  return (
    <View style={logoStyles.wrapper}>
      <Text style={logoStyles.blr}>BLR</Text>
      <Text style={logoStyles.realty}>Realty</Text>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  blr:    { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  realty: { fontSize: 14, fontWeight: '400', color: '#93C5FD', letterSpacing: 1 },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#1E3A8A" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            // ── Icons ──
            tabBarIcon: ({ focused, color, size }) => {
              const icons = {
                Browse: focused ? 'home'           : 'home-outline',
                Post:   focused ? 'add-circle'     : 'add-circle-outline',
                Admin:  focused ? 'shield'         : 'shield-outline',
              };
              return <Ionicons name={icons[route.name]} size={size} color={color} />;
            },

            // ── Tab bar appearance ──
            tabBarActiveTintColor:   '#2563EB',
            tabBarInactiveTintColor: '#94A3B8',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E2E8F0',
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 6,
              paddingTop: 4,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },

            // ── Header appearance ──
            headerStyle: {
              backgroundColor: '#1E3A8A',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#FFFFFF',
            headerTitle: () => <BLRRealtyLogo />,
            headerTitleAlign: 'left',
            headerRight: () => (
              <View style={headerStyles.tagline}>
                <Ionicons name="location" size={12} color="#93C5FD" />
                <Text style={headerStyles.taglineText}>Bangalore</Text>
              </View>
            ),
          })}
        >
          <Tab.Screen
            name="Browse"
            component={BrowseScreen}
            options={{ tabBarLabel: 'Browse' }}
          />
          <Tab.Screen
            name="Post"
            component={PostScreen}
            options={{ tabBarLabel: 'Post' }}
          />
          <Tab.Screen
            name="Admin"
            component={AdminScreen}
            options={{ tabBarLabel: 'Admin' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const headerStyles = StyleSheet.create({
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 16,
  },
  taglineText: {
    fontSize: 12,
    color: '#93C5FD',
    fontWeight: '500',
  },
});
