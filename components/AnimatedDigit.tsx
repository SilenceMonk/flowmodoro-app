import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface AnimatedDigitProps {
  digit: string;
  prevDigit: string;
}

const digitHeight = 60;

const AnimatedDigit: React.FC<AnimatedDigitProps> = ({ digit, prevDigit }) => {
  const position = useSharedValue(0);

  useEffect(() => {
    if (digit !== prevDigit) {
      const currentValue = Number(prevDigit);
      const targetValue = Number(digit);

      let distance = targetValue - currentValue;

      if (distance === -9) {
        distance = 1; // 9 to 0
      } else if (distance === 9) {
        distance = -1; // 0 to 9
      }

      position.value = -currentValue * digitHeight;
      position.value = withTiming(-targetValue * digitHeight, {
        duration: 300,
        easing: Easing.bounce,
      });
    }
  }, [digit, prevDigit]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: position.value }],
  }));

  return (
    <View style={styles.digitContainer}>
      <Animated.View style={[styles.columnContainer, animatedStyle]}>
        {[...Array(10)].map((_, index) => (
          <Text key={index} style={styles.digit}>
            {index}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  digitContainer: {
    height: digitHeight,
    width: 30,
    overflow: "hidden",
    backgroundColor: "#000000",
    borderRadius: 5,
    margin: 2,
  },
  columnContainer: {
    flexDirection: "column",
  },
  digit: {
    fontSize: 48,
    height: digitHeight,
    lineHeight: digitHeight,
    textAlign: "center",
    color: "#ECF0F1",
    fontWeight: "bold",
  },
});

export default AnimatedDigit;
