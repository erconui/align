import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useTheme } from '../hooks/useTheme';

export function Dropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const { colors, styles } = useTheme();

  const toggle = () => {
    Animated.timing(animation, {
      toValue: open ? 0 : 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
    setOpen(!open);
  };

  const height = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, options.length * 46], // row height
  });

  return (
    <View style={{ }}>
      {/* Label */}
      {/* <Text style={{ fontSize: 16, marginBottom: 6, fontWeight: "600" }}>
        Mode
      </Text> */}

      {/* Dropdown Header */}
      <Pressable
        onPress={toggle}
        style={{
          borderWidth: 1,
          borderColor: colors.buttonBorder,
          padding: 12,
          borderRadius: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={styles.DropdownText}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.button}
        />
      </Pressable>

      {/* Dropdown Body */}
      <Animated.View
        style={{
          overflow: "hidden",
          height,
          borderRadius: 8,
          borderWidth: open ? 1 : 0,
          borderColor: colors.border,
          marginTop: open ? 6 : 0,
        }}
      >
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              onChange(option);
              toggle();
            }}
            style={{
              padding: 12,
              backgroundColor: option === value ? colors.progressBackground : colors.popupBackground,
            }}
          >
            <Text style={styles.DropdownText}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}