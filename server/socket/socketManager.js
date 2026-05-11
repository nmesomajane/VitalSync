import { verifyToken } from "../utilis/jwt.js";
import VitalsService from "../services/vitalService.js";


const connectedUsers = new Map();

export const setupSocketIO = (io) => {


  io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
 
  if (!token) {
    return next(new Error("Authentication token required"));
  }

  try {
    const decoded = verifyToken(token);
    socket.userId = decoded.id;
    next();
  } catch (error) {
    return next(new Error("Invalid or expired token"));
  }
});


  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`);

    
    connectedUsers.set(socket.userId, socket.id);
    

    socket.join(socket.userId);
   

    socket.emit("connected", {
      message: "Real-time connection established",
      userId: socket.userId,
    });
    

    socket.on("join:caregiver:room", (patientId) => {
      socket.join(`caregiver:${patientId}`);
   
      console.log(`Caregiver joined room for patient: ${patientId}`);
    });

  

    socket.on("disconnect", () => {
      connectedUsers.delete(socket.userId);
      // remove from our Map — they're no longer connected
      console.log(`User disconnected: ${socket.userId}`);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error.message);
    });
  });
};



export const emitVitalsUpdate = (io, userId, vitalsData) => {
  io.to(userId).emit("vitals:update", vitalsData);

  io.to(`caregiver:${userId}`).emit("vitals:update", vitalsData);
};

export const emitAlert = (io, userId, alertData) => {
  io.to(userId).emit("vitals:alert", alertData);
 

  io.to(`caregiver:${userId}`).emit("vitals:alert", alertData);

};

export const isUserConnected = (userId) => {
  return connectedUsers.has(userId);

};