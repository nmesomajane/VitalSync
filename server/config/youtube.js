import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const searchYouTubeVideos = async (query, maxResults = 3) => {
  // query      → search term e.g. "heart rate variability exercises"


  if (!process.env.YOUTUBE_API_KEY) {
    console.warn("YOUTUBE_API_KEY missing , video suggestions disabled");
    return [];
  }

  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
      

          q: query,
    

          maxResults,
          // how many results to return — 3 saves quota

          type: "video",

          relevanceLanguage: "en",
 

          safeSearch: "strict",
         
          key: process.env.YOUTUBE_API_KEY,
       
        },
      }
    );

    return response.data.items.map((item) => ({
      videoId: item.id.videoId,
    
      title: item.snippet.title,

      channel: item.snippet.channelTitle,
  
      thumbnail: item.snippet.thumbnails.medium.url,

      description: item.snippet.description.slice(0, 150),

      watchUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
   

      publishedAt: item.snippet.publishedAt,
     
    }));

  } catch (error) {
    console.error("YouTube API error:", error.message);

    if (error.response?.status === 403) {
      console.error("YouTube quota exceeded or API key invalid");
    }

    return [];
  
  }
};