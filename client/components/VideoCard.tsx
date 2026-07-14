import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { YouTubeVideo } from "../src/services/ai";
import { Colors } from "../constants/colors";

interface VideoCardProps {
  video: YouTubeVideo;
}

export default function VideoCard({ video }: VideoCardProps) {
  const handlePress = async () => {
    console.log("VideoCard: opening video:", video.videoId);

    try {
      const canOpen = await Linking.canOpenURL(video.watchUrl);
 

      if (canOpen) {
        await Linking.openURL(video.watchUrl);
      } else {
        console.warn("VideoCard: cannot open URL:", video.watchUrl);
      }
    } catch (err) {
      console.error("VideoCard: failed to open video:", err);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={{
        backgroundColor: Colors.card,
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        flexDirection: "row",
        height: 80,
      }}
    >
      {/* Thumbnail */}
      <View
        style={{
          width: 120,
          backgroundColor: Colors.background,
          position: "relative",
       
        }}
      >
        {video.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            // uri = URL string from YouTube API
            style={{ width: 120, height: 80 }}
            resizeMode="cover"
           
          />
        ) : (
          
          <View
            style={{
              width: 120,
              height: 80,
              backgroundColor: Colors.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="videocam-outline"
              size={24}
              color={Colors.textMuted}
            />
          </View>
        )}

        {/* Play button overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.25)",
          
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.9)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="play" size={14} color="#1a1a1a" />
          </View>
        </View>
      </View>

      {/* Video info */}
      <View
        style={{
          flex: 1,
          padding: 10,
          justifyContent: "space-between",
        }}
      >
        {/* Title */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: Colors.textPrimary,
            lineHeight: 16,
          }}
          numberOfLines={2}
         
        >
          {video.title}
        </Text>

        {/* Channel + external link icon */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: Colors.textMuted,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {video.channel}
          </Text>

          <Ionicons
            name="open-outline"
            size={12}
            color={Colors.textMuted}
            style={{ marginLeft: 6 }}
       
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}