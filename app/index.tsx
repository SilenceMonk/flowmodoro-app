import React from "react";
import { View, ScrollView, Dimensions, StyleSheet } from "react-native";
import TimerScreen from "./TimerScreen";
import StatisticsScreen from "./StatisticsScreen";

const { width } = Dimensions.get("window");

export default function App() {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
    >
      <View style={styles.screen}>
        <TimerScreen />
      </View>
      <View style={styles.screen}>
        <StatisticsScreen />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#000", // Dark theme
  },
  screen: {
    width,
    flex: 1,
  },
});
