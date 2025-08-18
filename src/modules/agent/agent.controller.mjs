import { AccessToken } from "livekit-server-sdk";
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import path from "node:path";
import url from "node:url";

dotenv.config();
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

export const generateToken = async (req, res, next) => {
  const { roomName, userName } = req.body;

  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: userName,
  });

  at.addGrant({ roomJoin: true, room: roomName });

  const token = await at.toJwt();
  res.json({ token });
};
// export const generateToken = async (req, res, next) => {
//   try {
//     const { roomName, identity } = req.body;

//     if (!roomName || !identity) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing roomName or identity" });
//     }

//     const at = new AccessToken(API_KEY, API_SECRET, {
//       identity,
//     });

//     at.addGrant({
//       roomJoin: true,
//       room: roomName,
//       canPublish: true,
//       canSubscribe: true,
//     });

//     const token = await at.toJwt();

//     res.json({
//       token,
//       serverUrl: LIVEKIT_URL,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const agentJoin = async (req, res, next) => {
  try {
    const { roomName, agentIdentity = "assistant-bot" } = req.body || {};

    if (!roomName) {
      return res.status(400).json({ error: "Missing roomName" });
    }

    // Spawn agent.js with args
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const agentPath = path.join(__dirname, "agent.mjs");

    // Properly format the arguments
    const args = [
      agentPath,
      `--room=${roomName}`,
      `--identity=${agentIdentity}`,
    ];

    const child = spawn(
      process.execPath, // Node
      args,
      {
        env: process.env,
        stdio: "inherit",
      }
    );

    res.json({ ok: true, pid: child.pid });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
