import fs from "fs";
import axios from "axios";
import { formatToSRT, saveSRT } from "../src/util/SRT";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { unlink } from "../src/util/unlinkFile";

async function convertAudioToText(audioPath: string, uuid: string) {
  try {
    console.log(process.env.AZURE_SPEECH_SERVICE_KEY);
    console.log(process.env.AZURE_REGION);

    if (!process.env.AZURE_SPEECH_SERVICE_KEY || !process.env.AZURE_REGION) {
      throw new Error(
        "AZURE_SPEECH_KEY and AZURE_REGION must be defined in environment variables"
      );
    }
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_SERVICE_KEY as string,
      process.env.AZURE_REGION as string
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    let audioConfig = sdk.AudioConfig.fromWavFileInput(
      fs.readFileSync(audioPath)
    );
    let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    speechRecognizer.recognizeOnceAsync((result) => {
      switch (result.reason) {
        case sdk.ResultReason.RecognizedSpeech:
          create(result.text, uuid,audioPath);
          break;
        case sdk.ResultReason.NoMatch:
          console.log("NOMATCH: Speech could not be recognized.");
          break;
        case sdk.ResultReason.Canceled:
          const cancellation = sdk.CancellationDetails.fromResult(result);
          console.log(`CANCELED: Reason=${cancellation.reason}`);

          if (cancellation.reason == sdk.CancellationReason.Error) {
            console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
            console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
            console.log(
              "CANCELED: Did you set the speech resource key and region values?"
            );
          }
          break;
      }
      speechRecognizer.close();
    });
  } catch (err) {
    console.log(err);
  }
}

function create(text: string, uuid: string,audioPath:string) {
  console.log(`RECOGNIZED: Text=${text}`);
  const subtitlesText = text;
  const srtSubtitle = formatToSRT(subtitlesText);
  saveSRT(srtSubtitle, uuid);
}

export { convertAudioToText };
