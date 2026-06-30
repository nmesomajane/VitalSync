import React from "react";
import { View, Text, Dimensions } from "react-native";
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
} from "victory-native";

import { Ionicons } from "@expo/vector-icons";


const SCREEN_WIDTH = Dimensions.get("window").width;


interface ECGChartProps {
  data: { x: number; y: number }[];
 
  isLive: boolean;
  
  hasAnomaly: boolean;

}

export default function ECGChart({ data, isLive, hasAnomaly }: ECGChartProps) {


  const getLineColor = (): string => {
    if (hasAnomaly) return "#ef4444";
   
    if (isLive) return "#10b981";
   
    return "#3b82f6";
   
  };

  if (data.length === 0) {
    // no data state  shown when no ECG has been recorded
    return (
      <View style={{
        height: 180,
        backgroundColor: "#030a05",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#1e293b",
        marginHorizontal: 16,
        marginBottom: 16,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
      }}>
        <Ionicons name="pulse-outline" size={32} color="#334155" />
        <Text style={{ color: "#334155", fontSize: 13 }}>
          No ECG data yet
        </Text>
        <Text style={{ color: "#1e293b", fontSize: 11, textAlign: "center", paddingHorizontal: 24 }}>
          Post a reading with ecgData to see your waveform
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      backgroundColor: "#030a05",
     
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#0d2a1a",
      marginHorizontal: 16,
      marginBottom: 8,
      overflow: "hidden",
      
    }}>

      <VictoryChart
        width={SCREEN_WIDTH - 32}
  
        height={180}
        padding={{ top: 16, bottom: 28, left: 32, right: 12 }}
       
      >

        {/* X axis  time */}
        <VictoryAxis
         
          style={{
            axis: { stroke: "#0d2a1a", strokeWidth: 1 },
           
            tickLabels: { fill: "#1a4a2e", fontSize: 8 },
         
            grid: {
              stroke: "#0d2a1a",
              strokeWidth: 0.5,
              strokeDasharray: "4, 4",
             
            },
          }}
        />

        {/* Y axis — voltage amplitude */}
        <VictoryAxis
          dependentAxis
        
          style={{
            axis: { stroke: "#0d2a1a", strokeWidth: 1 },
            tickLabels: { fill: "#1a4a2e", fontSize: 8 },
            grid: {
              stroke: "#0d2a1a",
              strokeWidth: 0.5,
              strokeDasharray: "4, 4",
            },
          }}
        />

        {/* The ECG line */}
        <VictoryLine
          data={data}
         
          style={{
            data: {
              stroke: getLineColor(),
              
              strokeWidth: 1.8,
              
            },
          }}
          interpolation="natural"
       
        />

      </VictoryChart>

      {/* Time label */}
      <Text style={{
        fontSize: 9,
        color: "#1a4a2e",
        textAlign: "right",
        paddingRight: 16,
        paddingBottom: 8,
        marginTop: -8,
      }}>
        Time →
      </Text>
    </View>
  );
}

