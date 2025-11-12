import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface DraggableContextProps {
  children?: React.ReactNode;
  itemId: string;
  onDrop?: (itemId: string, finalPosition: { x: number; y: number }) => void;
  onDragStart?: (itemId: string) => void;
  onDragEnd?: (itemId: string) => void;
  dragOpacity?: number;
}
export const DraggableContext: React.FC<DraggableContextProps> = ({
  children,
  itemId,
  onDragStart,
  onDragEnd,
  onDrop,
  //   isDragging,
  dragOpacity = 0.8
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const isActive = useSharedValue(false);
  const startPos = useSharedValue({ x: 0, y: 0 });

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(250)
    .onBegin(() => {
      isActive.value = true;
      opacity.value = dragOpacity;
      startPos.value = { x: translateX.value, y: translateY.value };

      if (onDragStart) {
        runOnJS(onDragStart)(itemId);
      }
    })
    .onUpdate((event) => {
      translateX.value = startPos.value.x + event.translationX;
      translateY.value = startPos.value.y + event.translationY;

      // You can add logic here to detect drop targets
      // and call onHover or similar callbacks
    })
    .onEnd(() => {
      const finalPosition = { x: translateX.value, y: translateY.value };

      if (onDrop) {
        runOnJS(onDrop)(itemId, finalPosition);
      }

      // Reset position
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);
      isActive.value = false;

      if (onDragEnd) {
        runOnJS(onDragEnd)(itemId);
      }
    })
    .onFinalize(() => {
      if (isActive.value) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
        isActive.value = false;

        if (onDragEnd) {
          runOnJS(onDragEnd)(itemId);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(isActive.value ? 1.03 : 1) }
      ],
      opacity: opacity.value,
      backgroundColor: isActive.value ? '#e3f2fd' : 'transparent',
      zIndex: isActive.value ? 999 : 1,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};