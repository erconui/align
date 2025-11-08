import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../src/hooks/useTheme';
import { useTaskStore } from '../src/stores/taskStore';

function InnerLayout() {
  const {init} = useTaskStore();
  const {colors} = useTheme();

  useEffect(() => {
    init();
  }, []);

  // For web we can set a full-screen background via View wrapper
  return (
    <GestureHandlerRootView style={{flex: 1, backgroundColor: colors.background}}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tabIconSelected,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Tasks',
            tabBarIcon: ({color, size}) => (
              <Ionicons name="checkbox-outline" size={size} color={color}/>
            ),
          }}
        />
        <Tabs.Screen
          name="template"
          options={{
            title: 'Lists',
            tabBarIcon: ({color, size}) => (
              <Ionicons name="list-outline" size={size} color={color}/>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({color, size}) => (
              // <Ionicons name="calendar-outline" size={size} color={color}/>
              <Ionicons name="settings-outline" size={size} color={color}/>
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}

export default function TabLayout() {
  // Wrap the whole app with ThemeProvider to provide colors
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}