import React from "react";
import { ScrollView, TouchableOpacity, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MetricKey } from "../hooks/useHistory";
import { Colors } from "../constants/colors";


const METRICS: {
  key: MetricKey;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    key: "heartRate",
    label: "Heart Rate",
    icon: "heart-outline",
    color: Colors.heartRate,

  },
  {
    key: "spO2",
    label: "SpO₂",
    icon: "water-outline",
    color: Colors.spO2,
    
  },
  {
    key: "bodyTemperature",
    label: "Temperature",
    icon: "thermometer-outline",
    color: Colors.temperature,
   
  },
  {
    key: "respiratoryRate",
    label: "Respiratory",
    icon: "pulse-outline",
    color: "#8b5cf6",
   
  },
  {
    key: "roomHumidity",
    label: "Humidity",
    icon: "water",
    color: Colors.humidity,
   
  },
];

interface MetricSelectorProps {
  selected: MetricKey;
 
  onSelect: (metric: MetricKey) => void;

}

export default function MetricSelector({
  selected,
  onSelect,
}: MetricSelectorProps) {
  return (
    <ScrollView
      horizontal
   
      showsHorizontalScrollIndicator={false}
    
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
      
        paddingVertical: 4,
      
      }}
      style={{ marginBottom: 16 }}
    >
      {METRICS.map((metric) => {
        const isActive = selected === metric.key;
      

        return (
          <TouchableOpacity
            key={metric.key}
          
            onPress={() => {
              console.log("MetricSelector: selected", metric.key);
              onSelect(metric.key);
          
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
           
              backgroundColor: isActive
                ? `${metric.color}20`
               
                : Colors.card,
                
              borderWidth: 1,
              borderColor: isActive
                ? `${metric.color}60`
       
                : Colors.cardBorder,
         
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={metric.icon as any}
              size={14}
              color={isActive ? metric.color : Colors.textMuted}
              
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: isActive ? "700" : "500",
                
                color: isActive ? metric.color : Colors.textMuted,
               
              }}
            >
              {metric.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}