import { z } from "zod";

export const moodSchema = z.enum([
  "Mellow",
  "Upbeat",
  "Classic",
  "Quirky",
  "Clean",
  "Dance",
]);

export const playlistModeSchema = z.enum([
  "Breakfast boost",
  "Car ride calm",
  "Kitchen dance party",
  "Wind-down",
  "Parent nostalgia",
  "Silly sing-alongs",
]);

export const musicProviderSchema = z.enum(["Spotify", "Apple Music", "YouTube Music"]);

export const playlistRequestSchema = z.object({
  seedSong: z.string().trim().min(2, "Add a song or artist to start."),
  filters: z.array(moodSchema).max(6).default([]),
  mode: playlistModeSchema.default("Breakfast boost"),
  provider: musicProviderSchema.default("Spotify"),
});

export const playlistTrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  duration: z.string(),
  mood: z.string(),
  energy: z.number().min(0).max(100),
  danceability: z.number().min(0).max(100),
  valence: z.number().min(0).max(100),
  previewUrl: z.string().nullable(),
  spotifyUrl: z.string(),
  appleMusicUrl: z.string(),
  youtubeMusicUrl: z.string(),
  searchUrl: z.string(),
  artwork: z.string(),
  clean: z.boolean(),
  apolloMatch: z.number().min(0).max(100),
  reasons: z.array(z.string()).min(2).max(4),
});

export const playlistResponseSchema = z.object({
  seedSong: z.string(),
  title: z.string(),
  summary: z.string(),
  source: z.enum(["spotify", "demo"]),
  shareUrl: z.string(),
  tracks: z.array(playlistTrackSchema).length(10),
});

export type Mood = z.infer<typeof moodSchema>;
export type PlaylistMode = z.infer<typeof playlistModeSchema>;
export type MusicProvider = z.infer<typeof musicProviderSchema>;
export type PlaylistRequest = z.infer<typeof playlistRequestSchema>;
export type PlaylistTrack = z.infer<typeof playlistTrackSchema>;
export type PlaylistResponse = z.infer<typeof playlistResponseSchema>;
