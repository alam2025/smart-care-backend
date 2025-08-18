import dotenv from "dotenv";
dotenv.config();

import { Worker, initializeLogger } from "@livekit/agents";
import { OpenAI } from "openai";
import fs from "fs";
import { exec } from "child_process";
import path from "path";

// Initialize logger
initializeLogger({ pretty: true, level: "info" });

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to convert text → speech using OpenAI TTS
async function textToSpeech(replyText, outFile) {
  // Generate TTS audio (wav)
  const speechResp = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts", // TTS model
    voice: "alloy",
    input: replyText,
  });

  const audioBuffer = Buffer.from(await speechResp.arrayBuffer());
  fs.writeFileSync(outFile, audioBuffer);

  // Convert to raw PCM using ffmpeg for LiveKit
  const pcmFile = outFile.replace(".wav", ".raw");
  await new Promise((resolve, reject) => {
    exec(
      `ffmpeg -y -i ${outFile} -f s16le -ar 48000 -ac 1 ${pcmFile}`,
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });

  return pcmFile;
}

// Create worker
new Worker({
  apiKey: process.env.LIVEKIT_API_KEY,
  secret: process.env.LIVEKIT_API_SECRET,
  url: process.env.LIVEKIT_URL,
  async onParticipant(ctx) {
    console.log(`Agent joined room: ${ctx.room.name}`);

    // Step 1: Greet
    await ctx.say(
      "Hello! Thank you for joining. I’m here to help you book a doctor’s appointment."
    );

    // Step 2: Ask question
    await ctx.say(
      "May I know which doctor or type of appointment you are looking for today?"
    );

    // Step 3: Listen for participant speech
    ctx.on("transcription", async (text) => {
      console.log("User said:", text);

      // GPT response
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant booking doctor appointments.",
          },
          { role: "user", content: text },
        ],
      });

      const reply = completion.choices[0].message.content;
      console.log("Agent reply:", reply);

      // Convert reply → audio
      const outFile = path.join(process.cwd(), "reply.wav");
      const pcmFile = await textToSpeech(reply, outFile);

      // Publish audio to room
      await ctx.publishAudioFile(pcmFile);
    });

    await ctx.listenForParticipantEvents();
  },
});

console.log("✅ LiveKit Agent Worker running...");
