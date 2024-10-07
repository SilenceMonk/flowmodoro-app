import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import AnimatedDigit from "../components/AnimatedDigit";

const { width, height } = Dimensions.get("window");

const TimerScreen: React.FC = () => {
  const [session, setSession] = useState<"welcome" | "work" | "break">("welcome");
  const [todayTotalWorkTime, setTodayTotalWorkTime] = useState<number>(0); // TODO: when transitioning from work to welcome, the today's total work time is always 0
  const [workTime, setWorkTime] = useState<number>(0);
  const [breakTime, setBreakTime] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);

  const workTimerScale = useSharedValue(1);
  const breakTimerScale = useSharedValue(0.6);
  const workTimerPosition = useSharedValue(height * 0.3);
  const breakTimerPosition = useSharedValue(height * 0.5);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTodayTotalWorkTime();
  }, []);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        if (session === "work") {
          setWorkTime((prevTime) => {
            const newWorkTime = prevTime + 1;
            setBreakTime(Math.floor(newWorkTime / 5));
            return newWorkTime;
          });
        } else if (session === "break") {
          setBreakTime((prevTime) => {
            if (prevTime <= 0) {
              changeSession("work");
              return 0;
            }
            return prevTime - 1;
          });
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, session]);

  const AnimatedTimer: React.FC<{ time: number }> = useCallback(({ time }) => {
    const formattedTime = formatTime(time);
    const [prevFormattedTime, setPrevFormattedTime] = useState(formattedTime);
  
    useEffect(() => {
      setPrevFormattedTime((prev) => {
        if (prev !== formattedTime) {
          return formattedTime;
        }
        return prev;
      });
    }, [formattedTime]);
  
    return (
      <View style={styles.animatedTimerContainer}>
        {formattedTime.split("").map((digit, index) => {
          if (digit === ":") {
            return (
              <Text key={index} style={styles.colonText}>
                :
              </Text>
            );
          }
          return (
            <AnimatedDigit
              key={index}
              digit={digit}
              prevDigit={prevFormattedTime[index]}
            />
          );
        })}
      </View>
    );
  }, []);

  const workTimerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: workTimerScale.value }],
      top: workTimerPosition.value,
    };
  });

  const breakTimerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breakTimerScale.value }],
      top: breakTimerPosition.value,
    };
  });

  const loadTodayTotalWorkTime = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const totalWorkTime = await AsyncStorage.getItem(`@totalWorkTime_${today}`);
      if (totalWorkTime !== null) {
        setTodayTotalWorkTime(parseInt(totalWorkTime));
        // console.log("Total work time found for today:", totalWorkTime);
        console.log(
          "Total work time found for today:",
          Math.floor(todayTotalWorkTime / 1000)
        );

        console.log(
          "Total work time found for today raw:",
          todayTotalWorkTime
        );
      } else {
        setTodayTotalWorkTime(0);
        console.log("No total work time found for today");
      }
    } catch (e) {
      console.error(e);
      setTodayTotalWorkTime(0);
    }
  };

  const saveTodayTotalWorkTime = async (duration: number) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const totalWorkTime = await AsyncStorage.getItem(`@totalWorkTime_${today}`);
      let newTotalWorkTime = duration;
      if (totalWorkTime !== null) {
        newTotalWorkTime += parseInt(totalWorkTime);
      }
      await AsyncStorage.setItem(`@totalWorkTime_${today}`, newTotalWorkTime.toString());
      setTodayTotalWorkTime(newTotalWorkTime);
    } catch (e) {
      console.error(e);
    }
  };

  const changeSession = (newSession: "welcome" | "work" | "break") => {
    setSession(newSession);

    if (newSession === "break") {
      workTimerScale.value = withTiming(0.6, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
      breakTimerScale.value = withTiming(1, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
      workTimerPosition.value = withTiming(height * 0.25, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
      breakTimerPosition.value = withTiming(height * 0.45, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
    } else if (newSession === "work") {
      workTimerScale.value = withTiming(1, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
      breakTimerScale.value = withTiming(0.6, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
      workTimerPosition.value = withTiming(height * 0.3, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
      breakTimerPosition.value = withTiming(height * 0.5, {
        duration: 500,
        easing: Easing.inOut(Easing.ease),
      });
    }
  };

  const handleScreenPress = () => {
    if (session === "welcome") {
      changeSession("work");
      setWorkStartTime(new Date());
      setIsActive(true);
    } else if (session === "work") {
      changeSession("break");
      setIsActive(true);
    } else if (session === "break") {
      changeSession("work");
      setIsActive(true);
    }
  };

  const handleLongPress = async () => {
    if (session === "work" || session === "break") {
      setIsActive(false);
      const workEndTime = new Date();
      if (workStartTime) {
        const duration = workEndTime.getTime() - workStartTime.getTime();
        await saveWorkSessionData(workStartTime, workEndTime, duration);
      }
      setWorkTime(0);
      setBreakTime(0);
      changeSession("welcome");
      await loadTodayTotalWorkTime();

    }
  };

  const saveWorkSessionData = async (startTime: Date, endTime: Date, duration: number) => {
    try {
      const sessionData = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: duration,
      };
      const sessions = await AsyncStorage.getItem("@workSessions");
      let sessionsArray = [];
      if (sessions !== null) {
        sessionsArray = JSON.parse(sessions);
      }
      sessionsArray.push(sessionData);
      await AsyncStorage.setItem("@workSessions", JSON.stringify(sessionsArray));
      await saveTodayTotalWorkTime(duration);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleScreenPress}
      onLongPress={handleLongPress}
    >
      <View style={styles.sessionContainer}>
        {session === "welcome" && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Today's Total Work Time</Text>
            <AnimatedTimer time={Math.floor(todayTotalWorkTime / 1000)} />
            <Text style={styles.instructionText}>Tap to start working</Text>
          </View>
        )}
        {(session === "work" || session === "break") && (
          <>
            <Animated.View style={[styles.timerContainer, workTimerAnimatedStyle]}>
              <Text style={styles.sessionText}>Work Session</Text>
              <AnimatedTimer time={workTime} />
            </Animated.View>
            <Animated.View style={[styles.timerContainer, breakTimerAnimatedStyle]}>
              <Text style={styles.sessionText}>Break Session</Text>
              <AnimatedTimer time={breakTime} />
            </Animated.View>
            <Text style={styles.instructionText}>
              {session === "work" ? "Tap to start break" : "Tap to resume work"}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// TODO: change font family

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  sessionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "absolute",
    width: "100%",
  },
  welcomeText: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 20,
  },
  totalWorkTimeText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 40,
  },
  timerContainer: {
    position: "absolute",
    alignItems: "center",
    width: width,
  },
  sessionText: {
    color: "#fff",
    fontSize: 24,
    marginBottom: 10,
  },
  timerText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    fontStyle: "italic",
    position: "absolute",
    bottom: height * 0.1,
  },
  animatedTimerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  colonText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
    marginHorizontal: 4.5,
  },
});

export default TimerScreen;