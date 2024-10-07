import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import { ContributionGraph, LineChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

interface WorkSession {
  startTime: string;
  endTime: string;
  duration: number;
}

const StatisticsScreen: React.FC = () => {
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);

  useEffect(() => {
    loadWorkSessions();
  }, []);

  const loadWorkSessions = async () => {
    try {
      const sessions = await AsyncStorage.getItem("@workSessions");
      if (sessions !== null) {
        setWorkSessions(JSON.parse(sessions));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const processDataForContributionGraph = () => {
    const data: { date: string; count: number }[] = [];
    const dateMap: { [date: string]: number } = {};

    workSessions.forEach((session) => {
      const date = session.startTime.split("T")[0];
      if (!dateMap[date]) {
        dateMap[date] = 0;
      }
      dateMap[date] += session.duration / 1000 / 60; // Convert ms to minutes
    });

    for (const date in dateMap) {
      data.push({ date, count: Math.round(dateMap[date]) });
    }

    return data;
  };

  const processDataForLineChart = () => {
    const data: number[] = [];
    const labels: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      labels.push(dateString.slice(5));
      const sessionsForDate = workSessions.filter((session) =>
        session.startTime.startsWith(dateString)
      );
      const totalDuration = sessionsForDate.reduce(
        (sum, session) => sum + session.duration / 1000 / 60,
        0
      ); // in minutes
      data.push(Math.round(totalDuration));
    }
    return { labels, data };
  };

  const contributionData = processDataForContributionGraph();
  const lineChartData = processDataForLineChart();

  const calculateTotalWorkTime = () => {
    const totalMinutes = workSessions.reduce(
      (sum, session) => sum + session.duration / 1000 / 60,
      0
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.totalTimeContainer}>
          <Text style={styles.totalTimeLabel}>Total Work Time</Text>
          <Text style={styles.totalTimeValue}>{calculateTotalWorkTime()}</Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Work History</Text>
          <ContributionGraph
            values={contributionData}
            endDate={new Date()}
            numDays={91}
            width={width - 60}
            height={220}
            chartConfig={chartConfig}
            tooltipDataAttrs={() => ({})}
            style={styles.contributionGraph}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Past 7 Days Work Time</Text>
          <LineChart
            data={{
              labels: lineChartData.labels,
              datasets: [
                {
                  data: lineChartData.data,
                },
              ],
            }}
            width={width - 60}
            height={220}
            yAxisSuffix="m"
            yAxisInterval={1}
            chartConfig={chartConfig}
            bezier
            style={styles.lineChart}
          />
          {/* TODO: Use another line chart to display a certain day's work time distribution */}
        </View>
      </View>
    </ScrollView>
  );
};

// TODO: change font family

const chartConfig = {
  backgroundColor: "#1e1e1e",
  backgroundGradientFrom: "#1e1e1e",
  backgroundGradientTo: "#1e1e1e",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#ffffffe8",
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    marginTop: 40,
  },
  totalTimeContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  totalTimeLabel: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 5,
  },
  totalTimeValue: {
    color: "#ffa726",
    fontSize: 28,
    fontWeight: "bold",
  },
  chartContainer: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  chartTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  contributionGraph: {
    marginVertical: -13,
    borderRadius: 16,
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default StatisticsScreen;
