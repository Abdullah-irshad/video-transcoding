import fs from "fs";
import { spawn } from "child_process";
import { convertAudioToText } from "../../azure/AudioToTextService";
import { unlink } from "../util/unlinkFile";

class FFmpeg {
    private constructor() {}
    private static instance: FFmpeg;

    public static getInstance(): FFmpeg {
        if (!FFmpeg.instance) {
            FFmpeg.instance = new FFmpeg();
        }
        return FFmpeg.instance;
    }

    public async extractAudio(videoPath:string,uuid:string){
        console.log("called");
        const filePath = `../audio/${uuid}`;
        const audioFilePath = `${filePath}/audio.wav`;
        if(!fs.existsSync(filePath)){
            fs.mkdirSync(filePath,{recursive:true});
        }
        const ffmpegCommand = [
            "-i", videoPath,      // Input file
            "-ac", "1",           // Set audio channels to mono
            "-ar", "16000",       // Set audio sample rate to 16kHz
            "-c:a", "pcm_s16le",  // Set audio codec to PCM 16-bit little-endian
            audioFilePath         // Output file path
        ];
        await this.runFFmpeg(ffmpegCommand);
        unlink(videoPath); /// delete video file
        await convertAudioToText(audioFilePath,uuid);
    }

    public async convert(path: string,uuid:string){
        const folderId = uuid;
        const outputPath = `../transcoded/${folderId}`;
        const masterPlaylistPath = `${outputPath}/index.m3u8`;
    
        console.log(outputPath, masterPlaylistPath);
    
        try {
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }
        } catch (err) {
            console.error("Error creating output directory:", err);
            throw new Error("Failed to create output directory");
        }
    
        // Define resolutions and bitrates for adaptive streaming
        const resolutions = [
            { width: 1920, height: 1080, videoBitrate: "5000k", audioBitrate: "192k", name: "1080p" },
            { width: 1280, height: 720, videoBitrate: "1500k", audioBitrate: "128k", name: "720p" },
            { width: 854, height: 480, videoBitrate: "800k", audioBitrate: "96k", name: "480p" },
            { width: 640, height: 360, videoBitrate: "400k", audioBitrate: "64k", name: "360p" },
        ];
    
        const playlistPaths: { path: string; bitrate: string; resolution: string, id:string }[] = [];
    
        // Generate HLS playlists for each resolution
        for (const { width, height, videoBitrate, audioBitrate, name } of resolutions) {
            const resolutionOutputPath = `${outputPath}/${name}`;
            const hlsPlaylistPath = `${resolutionOutputPath}/index.m3u8`;
            playlistPaths.push({ path: hlsPlaylistPath, bitrate: videoBitrate, resolution: `${width}x${height}`, id:folderId });
    
            try {
                if (!fs.existsSync(resolutionOutputPath)) {
                    fs.mkdirSync(resolutionOutputPath, { recursive: true });
                }
            } catch (err) {
                console.error("Error creating resolution output directory:", err);
                throw new Error("Failed to create resolution output directory");
            }
    
            const ffmpegCommand = [
                "-i", path,
                "-codec:v", "libx264", "-preset", "veryfast", "-b:v", videoBitrate, "-maxrate", videoBitrate, "-bufsize", `${parseInt(videoBitrate) * 2}k`,
                "-vf", `scale=${width}:${height}`,
                "-codec:a", "aac", "-b:a", audioBitrate,
                "-hls_time", "10",
                "-hls_playlist_type", "vod",
                "-hls_segment_filename", `${resolutionOutputPath}/segment%03d.ts`,
                hlsPlaylistPath,
            ];

            await this.runFFmpeg(ffmpegCommand);
        }
    
        // Create the master playlist
        const masterPlaylistContent = this.generateMasterPlaylist(playlistPaths);
        fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);
    
        console.log(`Adaptive bitrate HLS created successfully: ${masterPlaylistPath}`);;
    }

    private async runFFmpeg(ffmpegCommand: string[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const ffmpegProcess = spawn("ffmpeg", ffmpegCommand);
    
            ffmpegProcess.stdout.on("data", (data) => {
                // Handle stdout
                console.log(`FFmpeg stdout: ${data.toString()}`);
            });
    
            ffmpegProcess.stderr.on("data", (data) => {
                // Handle stderr
                console.error(`FFmpeg stderr: ${data.toString()}`);
            });
    
            ffmpegProcess.on("close", (code) => {
                // Process completed successfully
                if (code === 0) {
                    console.log("FFmpeg process completed successfully.");
                    resolve();
                } else {
                    // Handle non-zero exit codes (error cases)
                    console.error(`FFmpeg process exited with code ${code}.`);
                    reject(new Error(`FFmpeg process failed with code ${code}`));
                }
            });
    
            ffmpegProcess.on("error", (err) => {
                // Handle errors during spawn
                console.error("Error spawning FFmpeg process:", err);
                reject(new Error("Error spawning FFmpeg process"));
            });
    
            ffmpegProcess.on("exit", (code, signal) => {
                if (signal) {
                    // Handle process termination by signal
                    console.error(`FFmpeg process was terminated by signal: ${signal}`);
                    reject(new Error(`FFmpeg process terminated by signal: ${signal}`));
                }
            });
        });
    }
    
    private generateMasterPlaylist(playlists: { path: string; bitrate: string; resolution: string, id:string }[]): string {
        let content = "#EXTM3U\n";
        for (const { path, bitrate, resolution, id } of playlists) {
            let staticPath = path.replace("../","");
            staticPath = staticPath.replace(`${id}/`,"");
            staticPath = staticPath.replace(`transcoded/`,"");
            const bandwidth = parseInt(bitrate) * 1000; // Convert bitrate to bits per second
            content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`;
            content += staticPath+'\n';
        }
        return content;
    }
}

export { FFmpeg };
