import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useTaskStore } from '../src/stores/taskStore';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const { init } = useTaskStore();

  useEffect(() => {
    init();
  }, []);

  return (
      <Tabs
          screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#3B82F6',
              tabBarInactiveTintColor: '#6B7280',
          }}
          >
          <Tabs.Screen
              name="index"
              options={{
                  title: 'Tasks',
                  tabBarIcon: ({color, size}) => (
                      <Ionicons name="checkbox-outline" size={size} color={color} />
                  ),
              }}
          />
          <Tabs.Screen
              name="template"
              options={{
                  title: 'Templates',
              }}
          />
          <Tabs.Screen
              name="calendar"
              options={{
                  title: 'Calendar',
                  tabBarIcon: ({color, size}) => (
                      <Ionicons name="calendar-outline" size={size} color={color} />
                  ),
              }}
          />
      </Tabs>
  );
}