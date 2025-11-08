import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { useTaskStore } from '../src/stores/taskStore';

export default function SettingScreen() {
  const {
    initDB
  } = useTaskStore();
  const { colors, styles, toggleTheme, theme } = useTheme();

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Settings
        </Text>
      </View>
      <View style={{flex: 1, padding: 16, backgroundColor: colors.background}}>
        {/* Database Setting */}
        <View style={styles.settingsRow}>
          <Text style={{color: colors.text, fontWeight: '800', flex: 1}}>Database</Text>
          <Pressable 
            onPress={initDB}
            style={({pressed}) => [
              {
                backgroundColor: pressed ? colors.tint + '20' : 'transparent',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.tint,
              }
            ]}
          >
            <Text style={{color: colors.tint, fontWeight: '500'}}>Initialize</Text>
          </Pressable>
        </View>

        {/* Theme Setting */}
        <View style={styles.settingsRow}>
          <Text style={{color: colors.text, fontWeight: '800', flex: 1}}>Color Theme:</Text>
          <Pressable 
            onPress={toggleTheme}
            style={({pressed}) => [
              {
                backgroundColor: pressed ? colors.tint + '20' : 'transparent',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: colors.tint,
              }
            ]}
          >
            <Text style={{color: colors.tint, fontWeight: '500'}}>{theme}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}