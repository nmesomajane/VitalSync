import express from "express";
import { signIn, signOut,signUp ,getProfile} from "../controllers/auth.js";

import { authenticate } from "../middleware/authentication.js";



const router = express.Router();
// POST /api/v1/auth/signup

router.post('/signup',  signUp)
router.post('/signin',  signIn)
router.post('/signout', signOut)


// GET /api/v1/auth/profile
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, signOut);
export  default router