import aiService from "../services/aiService.js";
import asyncHandler from "../utilis/asyncHandler.js";

// POST /api/v1/ai/suggestions
export const getAISuggestions = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const days = parseInt(req.query.days) || 7;
  

  const suggestions = await aiService.getAISuggestions(userId, days);

  res.status(200).json({
    success: true,
    data: suggestions,
  });
});

// GET /api/v1/ai/videos
export const getVideoSuggestions = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { topic } = req.query;


  const result = await aiService.getVideoSuggestions(userId, topic);

  res.status(200).json({
    success: true,
    data: result,
  });
});