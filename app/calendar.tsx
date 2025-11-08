import { Link } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';

export default function CalendarScreen() {
  const { colors } = useTheme();
  return (
    <View style={{flex: 1, padding: 16, backgroundColor: colors.background}}>
      <Text style={{fontSize: 24, fontWeight: '700', marginBottom: 16, color: colors.text}}>
        Calendar View
      </Text>
      <Text style={{color: colors.muted, marginBottom: 16}}>
        NativeWind v4 is working!
      </Text>

      <Link href="/" asChild>
        <Text style={{color: colors.tint, fontWeight: '500'}}>← Back to Tasks</Text>
      </Link>
    </View>
  );
}