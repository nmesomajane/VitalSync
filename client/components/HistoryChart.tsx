import React from "react";
import { View, Text, Dimensions } from "react-native";
import { VictoryBar, VictoryChart, VictoryAxis } from "victory-native";
// VictoryBar = bar chart component
// we already have VictoryChart and VictoryAxis from the ECG screen
import { Ionicons } from "@expo/vector-icons";
import { MetricKey } from "../hooks/useHistory";
import { Colors } from "../constants/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;

// color and unit for each metric
// used to style the bars and format the axis labels
const METRIC_CONFIG: Record<MetricKey, { color: string; unit: string; label: string }> = {
  heartRate: { color: Colors.heartRate, unit: "bpm", label: "Heart Rate" },
  spO2: { color: Colors.spO2, unit: "%", label: "Blood Oxygen" },
  bodyTemperature: { color: Colors.temperature, unit: "°C", label: "Body Temp" },
  respiratoryRate: { color: "#8b5cf6", unit: "/min", label: "Respiratory" },
  roomHumidity: { color: Colors.humidity, unit: "%", label: "Humidity" },
};

interface HistoryChartProps {
  data: { x: number; y: number; label: string }[];

  selectedMetric: MetricKey;
  
  selectedDays: number;

}

export default function HistoryChart({
  data,
  selectedMetric,
  selectedDays,
}: HistoryChartProps) {
  const config = METRIC_CONFIG[selectedMetric];


  //  empty state 
  if (data.length === 0) {
    return (
      <View
        style={{
          height: 220,
          backgroundColor: Colors.card,
          borderRadius: 16,
          marginHorizontal: 16,
          marginBottom: 16,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: Colors.cardBorder,
          borderStyle: "dashed",
          gap: 8,
        }}
      >
        <Ionicons
          name="bar-chart-outline"
          size={36}
          color={Colors.textMuted}
        />
        <Text style={{ color: Colors.textMuted, fontSize: 14, fontWeight: "600" }}>
          No data available
        </Text>
        <Text
          style={{
            color: Colors.textMuted,
            fontSize: 12,
            textAlign: "center",
            paddingHorizontal: 32,
          }}
        >
          Post vitals readings to see your {selectedDays}-day history
        </Text>
      </View>
    );
  }

  //  calculate y axis domain 
  const values = data.map((d) => d.y).filter((v) => v > 0);
  const minY = Math.min(...values);
  const maxY = Math.max(...values);
  const padding = (maxY - minY) * 0.2 || 5;
 

  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        overflow: "hidden",
        paddingTop: 12,
      }}
    >
      {/* Chart title */}
      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 4,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: Colors.textSecondary,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {config.label} · {selectedDays}D
        </Text>
        <Text style={{ fontSize: 11, color: config.color, fontWeight: "600" }}>
          {config.unit}
        </Text>
      </View>

      {/* Victory Bar Chart */}
      <VictoryChart
        width={SCREEN_WIDTH - 32}
       
        height={200}
        padding={{ top: 16, bottom: 40, left: 44, right: 12 }}
    
        domain={{ y: [Math.max(0, minY - padding), maxY + padding] }}
   
      >
        {/* X axis — dates */}
        <VictoryAxis
          tickFormat={(_, index) => {
           
            if (data.length <= 7) {
              return data[index]?.label ?? "";
            
            }
            if (data.length <= 30) {
              return index % 5 === 0 ? data[index]?.label ?? "" : "";
            
            }
            return index % 10 === 0 ? data[index]?.label ?? "" : "";
        
          }}
          style={{
            axis: { stroke: Colors.cardBorder },
            tickLabels: {
              fill: Colors.textMuted,
              fontSize: 9,
              angle: data.length > 14 ? -30 : 0,
      
              textAnchor: data.length > 14 ? "end" : "middle",
              
            },
            grid: { stroke: "transparent" },
            
          }}
        />

        {/* Y axis — values */}
        <VictoryAxis
          dependentAxis
        
          tickFormat={(value) => `${Math.round(value)}`}
      
          style={{
            axis: { stroke: Colors.cardBorder },
            tickLabels: { fill: Colors.textMuted, fontSize: 9 },
            grid: {
              stroke: Colors.cardBorder,
              strokeWidth: 0.5,
              strokeDasharray: "3, 3",
      
            },
          }}
        />

        {/* Bars */}
        <VictoryBar
          data={data}
       
          style={{
            data: {
              fill: config.color,
            
              opacity: 0.85,
              
              borderRadius: 4,
      
            },
          }}
          cornerRadius={{ top: 4 }}
       
          animate={{
            duration: 400,
            
            onLoad: { duration: 300 },
          
          }}
        />
      </VictoryChart>
    </View>
  );
}