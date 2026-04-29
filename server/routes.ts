import type { Express } from "express";
import type { Server } from "node:http";
import {
  type Mood,
  type MusicProvider,
  type PlaylistMode,
  type PlaylistResponse,
  type PlaylistTrack,
  playlistRequestSchema,
} from "@shared/schema";
import { storage } from "./storage";

type SpotifyToken = {
  accessToken: string;
  expiresAt: number;
};

type SpotifyTrack = {
  id: string;
  name: string;
  explicit: boolean;
  duration_ms: number;
  preview_url: string | null;
  external_urls?: { spotify?: string };
  album?: {
    name?: string;
    images?: Array<{ url: string; width: number; height: number }>;
  };
  artists?: Array<{ name: string }>;
};

let tokenCache: SpotifyToken | null = null;

function serviceLinks(title: string, artist: string) {
  const query = encodeURIComponent(`${title} ${artist}`);
  return {
    spotifyUrl: `https://open.spotify.com/search/${query}`,
    appleMusicUrl: `https://music.apple.com/us/search?term=${query}`,
    youtubeMusicUrl: `https://music.youtube.com/search?q=${query}`,
    searchUrl: `https://www.google.com/search?q=${query}`,
  };
}

const demoCatalog: Array<Omit<PlaylistTrack, "id" | "mood"> & { tags: Mood[] }> = [
  {
    title: "Three Little Birds",
    artist: "Bob Marley & The Wailers",
    album: "Exodus",
    duration: "3:00",
    energy: 58,
    danceability: 82,
    valence: 93,
  previewUrl: null,
    ...serviceLinks("Three Little Birds", "Bob Marley & The Wailers"),
  artwork: "sun",
  clean: true,
  apolloMatch: 92,
  reasons: ["clean lyrics", "sunny chorus", "easy sing-along"],
  tags: ["Mellow", "Classic", "Clean"],
},
  {
    title: "Here Comes the Sun",
    artist: "The Beatles",
    album: "Abbey Road",
    duration: "3:06",
    energy: 54,
    danceability: 56,
    valence: 88,
    previewUrl: null,
    ...serviceLinks("Here Comes the Sun", "The Beatles"),
  artwork: "sun",
  clean: true,
  apolloMatch: 94,
  reasons: ["parent nostalgia", "gentle lift", "bright melody"],
  tags: ["Mellow", "Classic", "Clean"],
},
  {
    title: "September",
    artist: "Earth, Wind & Fire",
    album: "The Best of Earth, Wind & Fire",
    duration: "3:35",
    energy: 83,
    danceability: 70,
    valence: 98,
    previewUrl: null,
    ...serviceLinks("September", "Earth, Wind & Fire"),
  artwork: "spark",
  clean: true,
  apolloMatch: 96,
  reasons: ["classic groove", "high dance energy", "joyful chorus"],
  tags: ["Upbeat", "Classic", "Clean", "Dance"],
},
  {
    title: "Happy",
    artist: "Pharrell Williams",
    album: "G I R L",
    duration: "3:53",
    energy: 82,
    danceability: 65,
    valence: 96,
    previewUrl: null,
    ...serviceLinks("Happy", "Pharrell Williams"),
  artwork: "spark",
  clean: true,
  apolloMatch: 88,
  reasons: ["clean pop hook", "clap-along beat", "instant mood boost"],
  tags: ["Upbeat", "Clean", "Dance"],
},
  {
    title: "Banana Pancakes",
    artist: "Jack Johnson",
    album: "In Between Dreams",
    duration: "3:12",
    energy: 35,
    danceability: 76,
    valence: 67,
    previewUrl: null,
    ...serviceLinks("Banana Pancakes", "Jack Johnson"),
  artwork: "wave",
  clean: true,
  apolloMatch: 86,
  reasons: ["soft tempo", "not too chaotic", "cozy morning feel"],
  tags: ["Mellow", "Clean", "Quirky"],
},
  {
    title: "Walking on Sunshine",
    artist: "Katrina & The Waves",
    album: "Walking on Sunshine",
    duration: "3:58",
    energy: 88,
    danceability: 67,
    valence: 96,
    previewUrl: null,
    ...serviceLinks("Walking on Sunshine", "Katrina & The Waves"),
  artwork: "sun",
  clean: true,
  apolloMatch: 91,
  reasons: ["big sunny chorus", "parent nostalgia", "road-trip energy"],
  tags: ["Upbeat", "Classic", "Clean", "Dance"],
},
  {
    title: "The Rainbow Connection",
    artist: "Kermit the Frog",
    album: "The Muppet Movie",
    duration: "3:14",
    energy: 21,
    danceability: 42,
    valence: 48,
    previewUrl: null,
    ...serviceLinks("The Rainbow Connection", "Kermit the Frog"),
  artwork: "moon",
  clean: true,
  apolloMatch: 90,
  reasons: ["bedtime-safe", "gentle vocals", "kid-recognizable"],
  tags: ["Mellow", "Classic", "Quirky", "Clean"],
},
  {
    title: "Can’t Stop the Feeling!",
    artist: "Justin Timberlake",
    album: "TROLLS",
    duration: "3:56",
    energy: 83,
    danceability: 67,
    valence: 70,
    previewUrl: null,
    ...serviceLinks("Can’t Stop the Feeling!", "Justin Timberlake"),
  artwork: "spark",
  clean: true,
  apolloMatch: 89,
  reasons: ["movie-night familiar", "danceable beat", "clean chorus"],
  tags: ["Upbeat", "Clean", "Dance"],
},
  {
    title: "I’m Still Standing",
    artist: "Elton John",
    album: "Too Low for Zero",
    duration: "3:03",
    energy: 90,
    danceability: 50,
    valence: 77,
    previewUrl: null,
    ...serviceLinks("I’m Still Standing", "Elton John"),
  artwork: "bolt",
  clean: true,
  apolloMatch: 92,
  reasons: ["classic sing-along", "resilient energy", "parent-approved"],
  tags: ["Upbeat", "Classic", "Clean", "Dance"],
},
  {
    title: "Lovely Day",
    artist: "Bill Withers",
    album: "Menagerie",
    duration: "4:15",
    energy: 65,
    danceability: 69,
    valence: 79,
    previewUrl: null,
    ...serviceLinks("Lovely Day", "Bill Withers"),
  artwork: "sun",
  clean: true,
  apolloMatch: 87,
  reasons: ["smooth groove", "gentle optimism", "grown-up favorite"],
  tags: ["Mellow", "Classic", "Clean"],
},
  {
    title: "Dance Monkey",
    artist: "Tones And I",
    album: "The Kids Are Coming",
    duration: "3:29",
    energy: 59,
    danceability: 82,
    valence: 51,
    previewUrl: null,
    ...serviceLinks("Dance Monkey", "Tones And I"),
  artwork: "bolt",
  clean: true,
  apolloMatch: 82,
  reasons: ["silly hook", "kid-friendly bounce", "danceable beat"],
  tags: ["Quirky", "Clean", "Dance"],
},
  {
    title: "Roam",
    artist: "The B-52’s",
    album: "Cosmic Thing",
    duration: "4:54",
    energy: 84,
    danceability: 65,
    valence: 80,
    previewUrl: null,
    ...serviceLinks("Roam", "The B-52’s"),
  artwork: "wave",
  clean: true,
  apolloMatch: 85,
  reasons: ["quirky classic", "big chorus", "playful movement"],
  tags: ["Quirky", "Classic", "Clean", "Dance"],
},
  {
    title: "Send Me On My Way",
    artist: "Rusted Root",
    album: "When I Woke",
    duration: "4:23",
    energy: 75,
    danceability: 76,
    valence: 91,
    previewUrl: null,
    ...serviceLinks("Send Me On My Way", "Rusted Root"),
  artwork: "wave",
  clean: true,
  apolloMatch: 90,
  reasons: ["adventure feel", "kid-safe energy", "not too polished"],
  tags: ["Upbeat", "Quirky", "Clean"],
},
  {
    title: "You’ve Got a Friend in Me",
    artist: "Randy Newman",
    album: "Toy Story",
    duration: "2:04",
    energy: 40,
    danceability: 66,
    valence: 72,
    previewUrl: null,
    ...serviceLinks("You’ve Got a Friend in Me", "Randy Newman"),
  artwork: "moon",
  clean: true,
  apolloMatch: 93,
  reasons: ["beloved classic", "gentle humor", "family sing-along"],
  tags: ["Mellow", "Classic", "Quirky", "Clean"],
},
];

function seededIndex(seed: string, index: number, length: number) {
  const value = Array.from(`${seed}-${index}`).reduce(
    (total, char) => total + char.charCodeAt(0) * (index + 7),
    0,
  );
  return value % length;
}

function duration(ms: number) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function targetFeatures(filters: Mood[], mode: PlaylistMode) {
  const has = (mood: Mood) => filters.includes(mood);
  const modeEnergy =
    mode === "Wind-down" || mode === "Car ride calm" ? 0.34 : mode === "Kitchen dance party" ? 0.86 : 0.64;
  const modeDance = mode === "Kitchen dance party" ? 0.9 : mode === "Silly sing-alongs" ? 0.72 : 0.62;
  return {
    target_energy: has("Mellow") ? 0.32 : has("Upbeat") ? 0.78 : modeEnergy,
    target_danceability: has("Dance") ? 0.84 : has("Mellow") ? 0.48 : modeDance,
    target_valence: has("Upbeat") ? 0.86 : has("Quirky") ? 0.72 : 0.68,
    target_acousticness: has("Mellow") || has("Classic") ? 0.45 : 0.18,
  };
}

function moodForTrack(track: Pick<PlaylistTrack, "energy" | "danceability" | "valence">, filters: Mood[]) {
  if (filters.length > 0) return filters.slice(0, 2).join(" + ");
  if (track.energy > 76 && track.danceability > 68) return "Upbeat + Dance";
  if (track.energy < 45) return "Mellow";
  if (track.valence > 82) return "Sunny";
  return "Family Mix";
}

function modeReasons(mode: PlaylistMode) {
  const map: Record<PlaylistMode, string[]> = {
    "Breakfast boost": ["morning-friendly lift", "sunny start"],
    "Car ride calm": ["smooth car energy", "not too chaotic"],
    "Kitchen dance party": ["kitchen dance beat", "big movement energy"],
    "Wind-down": ["wind-down safe", "gentle tempo"],
    "Parent nostalgia": ["parent nostalgia", "classic appeal"],
    "Silly sing-alongs": ["silly sing-along", "kid-recognizable hook"],
  };
  return map[mode];
}

function apolloProfile(
  track: Pick<PlaylistTrack, "energy" | "danceability" | "valence" | "clean">,
  filters: Mood[],
  mode: PlaylistMode,
  baseReasons: string[] = [],
) {
  const reasons = new Set<string>(baseReasons);
  const modeBoost = modeReasons(mode);
  reasons.add(modeBoost[0]);

  if (track.clean || filters.includes("Clean")) reasons.add("clean lyrics");
  if (filters.includes("Classic")) reasons.add("parent nostalgia");
  if (filters.includes("Dance") || track.danceability > 72) reasons.add("danceable beat");
  if (filters.includes("Mellow") || track.energy < 45) reasons.add("gentle tempo");
  if (filters.includes("Quirky")) reasons.add("playful surprise");
  if (track.valence > 82) reasons.add("sunny chorus");
  if (track.energy > 78) reasons.add("high energy without chaos");

  const target = targetFeatures(filters, mode);
  const energyFit = 100 - Math.abs(track.energy / 100 - target.target_energy) * 70;
  const danceFit = 100 - Math.abs(track.danceability / 100 - target.target_danceability) * 55;
  const cleanFit = track.clean || !filters.includes("Clean") ? 8 : -18;
  const modeFit = mode === "Wind-down" && track.energy < 58 ? 8 : mode === "Kitchen dance party" && track.danceability > 68 ? 8 : 4;
  const score = Math.max(72, Math.min(98, Math.round((energyFit + danceFit) / 2 + cleanFit + modeFit)));

  return {
    apolloMatch: score,
    reasons: Array.from(reasons).slice(0, 3),
  };
}

async function getSpotifyToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!response.ok) return null;
  const token = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };
  return tokenCache.accessToken;
}

async function spotifyRequest<T>(token: string, path: string, params: Record<string, string | number>) {
  const url = new URL(`https://api.spotify.com/v1/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Spotify request failed: ${response.status}`);
  return (await response.json()) as T;
}

async function buildSpotifyPlaylist(seedSong: string, filters: Mood[], mode: PlaylistMode): Promise<PlaylistResponse | null> {
  const token = await getSpotifyToken();
  if (!token) return null;

  try {
    const search = await spotifyRequest<{ tracks: { items: SpotifyTrack[] } }>(token, "search", {
      q: seedSong,
      type: "track",
      limit: 1,
      market: "US",
    });
    const seed = search.tracks.items[0];
    if (!seed) return null;

    const features = targetFeatures(filters, mode);
    const recommendations = await spotifyRequest<{ tracks: SpotifyTrack[] }>(token, "recommendations", {
      limit: 30,
      market: "US",
      seed_tracks: seed.id,
      ...features,
    });

    const cleanOnly = filters.includes("Clean");
    const tracks = recommendations.tracks
      .filter((track) => !cleanOnly || !track.explicit)
      .slice(0, 10)
      .map((track, index): PlaylistTrack => {
        const base = {
          id: track.id || `spotify-${index}`,
          title: track.name,
          artist: track.artists?.map((artist) => artist.name).join(", ") || "Unknown artist",
          album: track.album?.name || "Spotify recommendation",
          duration: duration(track.duration_ms),
          energy: Math.round(features.target_energy * 100 + ((index % 3) - 1) * 8),
          danceability: Math.round(features.target_danceability * 100 + ((index % 4) - 2) * 6),
          valence: Math.round(features.target_valence * 100 + ((index % 5) - 2) * 5),
          previewUrl: track.preview_url,
          ...serviceLinks(track.name, track.artists?.[0]?.name || ""),
          spotifyUrl: track.external_urls?.spotify || serviceLinks(track.name, track.artists?.[0]?.name || "").spotifyUrl,
          artwork: track.album?.images?.[0]?.url || "spark",
          clean: !track.explicit,
        };
        return {
          ...base,
          energy: Math.max(0, Math.min(100, base.energy)),
          danceability: Math.max(0, Math.min(100, base.danceability)),
          valence: Math.max(0, Math.min(100, base.valence)),
          mood: moodForTrack(base, filters),
          ...apolloProfile(base, filters, mode),
        };
      });

    if (tracks.length < 10) return null;

    return {
      seedSong,
      title: playlistTitle(seedSong, filters),
      summary: `Matched from “${seed.name}” by ${seed.artists?.[0]?.name || "Spotify"} for ${mode.toLowerCase()} with ${filters.length ? filters.join(", ") : "balanced"} settings.`,
      source: "spotify",
      shareUrl: `https://open.spotify.com/search/${encodeURIComponent(seedSong)}`,
      tracks,
    };
  } catch {
    return null;
  }
}

function providerVerb(provider: MusicProvider) {
  return provider === "YouTube Music" ? "Open in YouTube Music" : `Open in ${provider}`;
}

function playlistTitle(seedSong: string, filters: Mood[]) {
  if (filters.includes("Mellow")) return `Cozy spins after ${seedSong}`;
  if (filters.includes("Dance")) return `Living room dance party`;
  if (filters.includes("Classic")) return `Little ears, big classics`;
  if (filters.includes("Quirky")) return `Oddball sing-alongs`;
  if (filters.includes("Upbeat")) return `Sunny ten-song boost`;
  return `Family mix from ${seedSong}`;
}

function buildDemoPlaylist(seedSong: string, filters: Mood[], mode: PlaylistMode, provider: MusicProvider): PlaylistResponse {
  const selected = demoCatalog
    .map((track, index) => {
      const overlap = filters.filter((filter) => track.tags.includes(filter)).length;
      const modeOverlap =
        mode === "Kitchen dance party" && track.tags.includes("Dance")
          ? 8
          : mode === "Wind-down" && track.tags.includes("Mellow")
            ? 8
            : mode === "Parent nostalgia" && track.tags.includes("Classic")
              ? 8
              : mode === "Silly sing-alongs" && track.tags.includes("Quirky")
                ? 8
                : mode === "Car ride calm" && track.energy < 70
                  ? 6
                  : mode === "Breakfast boost" && track.valence > 75
                    ? 6
                    : 0;
      const seedWeight = seededIndex(seedSong, index, 9);
      return { track, score: overlap * 10 + modeOverlap + seedWeight };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ track }) => track);

  const orderedSource = [...selected];
  const shift = seededIndex(seedSong, filters.length, orderedSource.length);
  const rotated = [...orderedSource.slice(shift), ...orderedSource.slice(0, shift)];

  const ordered = rotated.slice(0, 10).map((track, index) => {
    const id = `demo-${index}-${track.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const profile = apolloProfile(track, filters.length ? filters : track.tags.slice(0, 2), mode, track.reasons);
    return {
      ...track,
      id,
      mood: moodForTrack(track, filters.length ? filters : track.tags.slice(0, 2)),
      ...profile,
    };
  });

  return {
    seedSong,
    title: playlistTitle(seedSong, filters),
    summary: filters.length
      ? `Apollo is using its ${mode.toLowerCase()} profile plus ${filters.join(", ").toLowerCase()} signals, then preparing links for ${provider}.`
      : `Apollo is using its ${mode.toLowerCase()} profile and preparing links for ${provider}.`,
    source: "demo",
    shareUrl:
      provider === "Spotify"
        ? `https://open.spotify.com/search/${encodeURIComponent(seedSong)}`
        : provider === "Apple Music"
          ? `https://music.apple.com/us/search?term=${encodeURIComponent(seedSong)}`
          : `https://music.youtube.com/search?q=${encodeURIComponent(seedSong)}`,
    tracks: ordered,
  };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.get("/api/health", async (_req, res) => {
    res.json(await storage.health());
  });

  app.post("/api/playlist", async (req, res) => {
    const parsed = playlistRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message || "Invalid playlist request." });
      return;
    }

    const { seedSong, filters, mode, provider } = parsed.data;
    const spotifyPlaylist = await buildSpotifyPlaylist(seedSong, filters, mode);
    if (spotifyPlaylist) {
      spotifyPlaylist.summary = `${spotifyPlaylist.summary} ${providerVerb(provider)} links are ready on each track.`;
      spotifyPlaylist.tracks = spotifyPlaylist.tracks.map((track) => ({
        ...track,
        ...serviceLinks(track.title, track.artist),
      }));
    }
    res.json(spotifyPlaylist || buildDemoPlaylist(seedSong, filters, mode, provider));
  });

  return httpServer;
}
