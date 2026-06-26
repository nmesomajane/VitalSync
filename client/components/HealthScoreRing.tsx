import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import React from "react";

interface HealthScoreRingProps {
  score: number | null;
  size?: number;
 
}

export default function HealthScoreRing({ score, size = 100 }: HealthScoreRingProps) {

  const radius = (size / 2) - 10;

  const circumference = 2 * Math.PI * radius;


  const progress = score !== null ? (score / 100) * circumference : 0;

  const getColor = () => {
    if (score === null) return "#334155";

    if (score >= 75) return "#4ade80";
   
    if (score >= 50) return "#fbbf24";
   
    return "#e94560";
   
  };

  
  const getLabel = () => {
    if (score === null) return "No data";
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Poor";
  };

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>

      {/* SVG ring */}
      <Svg width={size} height={size}>

       
        <Circle
          cx={size / 2}
        
          cy={size / 2}

          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={8}
        
        />

        {/* Progress arc — the colored portion */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={8}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - progress}
          
          strokeLinecap="round"
         
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Score text centered inside the ring */}
      <View style={{
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Text style={{
          fontSize: size * 0.24,
          fontWeight: "800",
          color: getColor(),
        }}>
          {score ?? "--"}
        </Text>
        <Text style={{ fontSize: size * 0.10, color: "#64748b" }}>
          {getLabel()}
        </Text>
      </View>

    </View>
  );
}