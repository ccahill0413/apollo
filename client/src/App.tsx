import { useEffect, useMemo, useState } from "react";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Baby,
  Check,
  Copy,
  Headphones,
  Moon,
  Music2,
  Pause,
  Play,
  Share2,
  Sparkles,
  Sun,
} from "lucide-react";
import { Router, Route, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "./lib/queryClient";
import type { Mood, MusicProvider, PlaylistMode, PlaylistResponse, PlaylistTrack } from "@shared/schema";

const moods: Array<{ label: Mood; helper: string }> = [
  { label: "Mellow", helper: "quiet time" },
  { label: "Upbeat", helper: "sunny energy" },
  { label: "Classic", helper: "parents approve" },
  { label: "Quirky", helper: "silly sing-alongs" },
  { label: "Clean", helper: "family safe" },
  { label: "Dance", helper: "wiggle-ready" },
];

const starters = ["Here Comes the Sun", "Bluey Theme Tune", "Three Little Birds", "Shake It Off"];

const playlistModes: Array<{ label: PlaylistMode; helper: string }> = [
  { label: "Breakfast boost", helper: "sunny start" },
  { label: "Car ride calm", helper: "steady, not wild" },
  { label: "Kitchen dance party", helper: "move together" },
  { label: "Wind-down", helper: "soft landing" },
  { label: "Parent nostalgia", helper: "grown-up favorites" },
  { label: "Silly sing-alongs", helper: "playful hooks" },
];

const musicProviders: Array<{ label: MusicProvider; helper: string }> = [
  { label: "Spotify", helper: "playlist and search links" },
  { label: "Apple Music", helper: "Music app search links" },
  { label: "YouTube Music", helper: "video and music links" },
];

function Logo() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-logo">
      <svg
        aria-label="Apollo Corvus constellation logo"
        viewBox="0 0 48 48"
        className="h-11 w-11 text-primary"
        fill="none"
      >
        <rect x="5" y="5" width="38" height="38" rx="14" stroke="currentColor" strokeWidth="2.5" opacity="0.26" />
        <path
          d="M15 16.5 30.5 12 35 28.5 20 34 15 16.5Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M20 34 11.5 38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.54" />
        <path d="M30.5 12 37.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.42" />
        <circle cx="15" cy="16.5" r="3" fill="currentColor" />
        <circle cx="30.5" cy="12" r="2.7" fill="currentColor" />
        <circle cx="35" cy="28.5" r="3.1" fill="currentColor" />
        <circle cx="20" cy="34" r="2.8" fill="currentColor" />
        <circle cx="11.5" cy="38" r="1.8" fill="currentColor" opacity="0.72" />
      </svg>
      <div>
        <p className="text-sm font-bold leading-none">Apollo</p>
        <p className="text-xs text-muted-foreground">family playlist maker</p>
      </div>
    </div>
  );
}

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = prefersDark ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }

  return { theme, toggleTheme };
}

function artworkClass(artwork: string) {
  if (artwork.startsWith("http")) return "";
  return {
    sun: "from-amber-200 via-orange-200 to-rose-200 dark:from-amber-500 dark:via-orange-500 dark:to-rose-500",
    spark: "from-teal-200 via-sky-200 to-amber-100 dark:from-teal-500 dark:via-sky-500 dark:to-amber-500",
    wave: "from-cyan-100 via-teal-200 to-lime-100 dark:from-cyan-600 dark:via-teal-500 dark:to-lime-500",
    moon: "from-indigo-100 via-violet-100 to-amber-100 dark:from-slate-600 dark:via-indigo-600 dark:to-amber-500",
    bolt: "from-yellow-200 via-lime-100 to-teal-100 dark:from-yellow-500 dark:via-lime-500 dark:to-teal-500",
  }[artwork] || "from-muted to-card";
}

function Artwork({ track, index }: { track: PlaylistTrack; index: number }) {
  if (track.artwork.startsWith("http")) {
    return (
      <img
        src={track.artwork}
        alt={`${track.album} album art`}
        className="h-16 w-16 rounded-xl object-cover shadow-sm sm:h-20 sm:w-20"
        loading="lazy"
        decoding="async"
        data-testid={`img-artwork-${index}`}
      />
    );
  }

  return (
    <div
      className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${artworkClass(track.artwork)} shadow-sm sm:h-20 sm:w-20`}
      aria-label={`${track.mood} cover tile`}
      role="img"
      data-testid={`img-artwork-${index}`}
    >
      <Music2 className="h-7 w-7 text-foreground/70" aria-hidden="true" />
    </div>
  );
}

function SkeletonPlaylist() {
  return (
    <div className="space-y-3" aria-label="Generating playlist" data-testid="status-loading">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-4 rounded-2xl border border-card-border bg-card/80 p-4">
          <div className="h-16 w-16 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-2 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackCard({
  track,
  index,
  provider,
  activePreview,
  onPreview,
}: {
  track: PlaylistTrack;
  index: number;
  provider: MusicProvider;
  activePreview: string | null;
  onPreview: (track: PlaylistTrack) => void;
}) {
  const playing = activePreview === track.id;
  const providerHref =
    provider === "Spotify"
      ? track.spotifyUrl
      : provider === "Apple Music"
        ? track.appleMusicUrl
        : track.youtubeMusicUrl;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.25 }}
      className="group flex gap-4 rounded-2xl border border-card-border bg-card/90 p-3 shadow-sm backdrop-blur sm:p-4"
      data-testid={`card-track-${index}`}
    >
      <Artwork track={track} index={index} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold sm:text-base" data-testid={`text-track-title-${index}`}>
              {index + 1}. {track.title}
            </p>
            <p className="truncate text-xs text-muted-foreground sm:text-sm" data-testid={`text-track-artist-${index}`}>
              {track.artist} · {track.duration}
            </p>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
            {track.clean ? "Clean" : "Check"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
            {track.mood}
          </span>
          <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-black text-accent-foreground">
            Apollo Match {track.apolloMatch}%
          </span>
          <span className="text-xs text-muted-foreground">Energy {track.energy}</span>
          <span className="text-xs text-muted-foreground">Dance {track.danceability}</span>
        </div>
        <div className="mt-3 rounded-2xl bg-background/70 px-3 py-2" data-testid={`text-reasons-${index}`}>
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">Why this song?</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-foreground/85">{track.reasons.join(" · ")}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-9 rounded-full"
            onClick={() => onPreview(track)}
            data-testid={`button-play-${index}`}
          >
            {playing ? <Pause className="mr-1.5 h-3.5 w-3.5" /> : <Play className="mr-1.5 h-3.5 w-3.5" />}
            {track.previewUrl ? (playing ? "Pause" : "Preview") : "Open"}
          </Button>
          <a
            href={providerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-full border border-border px-3 text-xs font-bold hover-elevate active-elevate-2"
            data-testid={`link-provider-${index}`}
          >
            {provider}
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function PlaylistApp() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [seedSong, setSeedSong] = useState("Here Comes the Sun");
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>(["Clean", "Upbeat"]);
  const [selectedMode, setSelectedMode] = useState<PlaylistMode>("Breakfast boost");
  const [selectedProvider, setSelectedProvider] = useState<MusicProvider>("Spotify");
  const [playlist, setPlaylist] = useState<PlaylistResponse | null>(null);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const playlistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/playlist", {
        seedSong,
        filters: selectedMoods,
        mode: selectedMode,
        provider: selectedProvider,
      });
      return (await response.json()) as PlaylistResponse;
    },
    onSuccess: (data) => {
      setPlaylist(data);
      setActivePreview(null);
      audio?.pause();
    },
    onError: () => {
      toast({
        title: "Playlist could not be generated",
        description: "Try a different seed song or fewer filters.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    playlistMutation.mutate();
    return () => audio?.pause();
  }, []);

  const selectedLabel = useMemo(
    () => `${selectedMode} · ${selectedMoods.length ? selectedMoods.join(" · ") : "Balanced"}`,
    [selectedMode, selectedMoods],
  );

  function toggleMood(label: Mood) {
    setSelectedMoods((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    );
  }

  function playTrack(track: PlaylistTrack) {
    if (!track.previewUrl) {
      const providerHref =
        selectedProvider === "Spotify"
          ? track.spotifyUrl
          : selectedProvider === "Apple Music"
            ? track.appleMusicUrl
            : track.youtubeMusicUrl;
      window.open(providerHref || track.searchUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (activePreview === track.id) {
      audio?.pause();
      setActivePreview(null);
      return;
    }

    audio?.pause();
    const nextAudio = new Audio(track.previewUrl);
    nextAudio.addEventListener("ended", () => setActivePreview(null));
    nextAudio.play().catch(() => {
      toast({ title: "Preview blocked", description: `Open the track in ${selectedProvider} instead.` });
    });
    setAudio(nextAudio);
    setActivePreview(track.id);
  }

  async function sharePlaylist() {
    const text = playlist
      ? `${playlist.title}\n${playlist.tracks.map((track, index) => `${index + 1}. ${track.title} — ${track.artist}`).join("\n")}`
      : "Apollo family playlist";

    if (navigator.share) {
      await navigator.share({ title: playlist?.title || "Apollo", text });
      return;
    }

    await navigator.clipboard.writeText(text);
    toast({ title: "Copied playlist", description: "The 10-song list is ready to paste." });
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.18),transparent_26%),radial-gradient(circle_at_85%_15%,hsl(var(--chart-4)/0.18),transparent_24%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          data-testid="button-theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </header>

      <main id="main" className="relative z-10 mx-auto grid w-full max-w-6xl gap-6 px-4 pb-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="lg:sticky lg:top-6 lg:self-start" aria-labelledby="hero-title">
          <div className="rounded-[2rem] border border-card-border bg-card/88 p-5 shadow-xl backdrop-blur sm:p-7">
            <div className="mb-5 flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
              <Headphones className="h-4 w-4" />
              Music model builder for families
            </div>
            <h1 id="hero-title" className="max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">
              Start with one song. Get ten tracks everyone in the car can live with.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
              Choose a seed song, teach Apollo the family moment, and send the resulting music model to Spotify, Apple Music, or YouTube Music.
            </p>

            <form
              className="mt-7 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                playlistMutation.mutate();
              }}
            >
              <div>
                <label htmlFor="seed-song" className="mb-2 block text-sm font-bold">
                  Seed song
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="seed-song"
                    value={seedSong}
                    onChange={(event) => setSeedSong(event.target.value)}
                    placeholder="Try “Yellow Submarine”"
                    className="h-12 rounded-full border-input bg-background/80 px-5 text-base"
                    data-testid="input-seed-song"
                  />
                  <Button
                    type="submit"
                    disabled={playlistMutation.isPending || seedSong.trim().length < 2}
                    className="h-12 rounded-full px-6 font-black"
                    data-testid="button-generate"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </div>
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-bold">Music service</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {musicProviders.map((provider) => {
                    const active = selectedProvider === provider.label;
                    return (
                      <button
                        key={provider.label}
                        type="button"
                        onClick={() => setSelectedProvider(provider.label)}
                        className={`min-h-14 rounded-2xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border bg-background/70 hover-elevate active-elevate-2"
                        }`}
                        aria-pressed={active}
                        data-testid={`button-provider-${provider.label.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        <span className="text-sm font-black">{provider.label}</span>
                        <span className={`mt-0.5 block text-[11px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {provider.helper}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-bold">Playlist mode</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {playlistModes.map((mode) => {
                    const active = selectedMode === mode.label;
                    return (
                      <button
                        key={mode.label}
                        type="button"
                        onClick={() => setSelectedMode(mode.label)}
                        className={`min-h-14 rounded-2xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border bg-background/70 hover-elevate active-elevate-2"
                        }`}
                        aria-pressed={active}
                        data-testid={`button-mode-${mode.label.toLowerCase().replaceAll(" ", "-")}`}
                      >
                        <span className="text-sm font-black">{mode.label}</span>
                        <span className={`mt-0.5 block text-[11px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {mode.helper}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-sm font-bold">Vibe filters</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {moods.map((mood) => {
                    const active = selectedMoods.includes(mood.label);
                    return (
                      <button
                        key={mood.label}
                        type="button"
                        onClick={() => toggleMood(mood.label)}
                        className={`min-h-14 rounded-2xl border px-3 py-2 text-left transition ${
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-md"
                            : "border-border bg-background/70 hover-elevate active-elevate-2"
                        }`}
                        aria-pressed={active}
                        data-testid={`button-filter-${mood.label.toLowerCase()}`}
                      >
                        <span className="flex items-center justify-between text-sm font-black">
                          {mood.label}
                          {active ? <Check className="h-4 w-4" /> : null}
                        </span>
                        <span className={`mt-0.5 block text-[11px] ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {mood.helper}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-wrap gap-2">
                {starters.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => setSeedSong(starter)}
                    className="rounded-full border border-border bg-background/70 px-3 py-2 text-xs font-bold hover-elevate active-elevate-2"
                    data-testid={`button-starter-${starter.toLowerCase().replaceAll(" ", "-")}`}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </form>

            <div className="mt-7 grid grid-cols-3 gap-3 rounded-3xl bg-background/65 p-3">
              <div>
                <p className="text-xl font-black">10</p>
                <p className="text-xs text-muted-foreground">tracks</p>
              </div>
              <div>
                <p className="text-xl font-black">6</p>
                <p className="text-xs text-muted-foreground">vibes</p>
              </div>
              <div>
                <p className="text-xl font-black">0</p>
                <p className="text-xs text-muted-foreground">lock-in</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="playlist-title">
          <div className="rounded-[2rem] border border-card-border bg-card/88 p-4 shadow-xl backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground" data-testid="text-selected-filters">
                  {selectedLabel}
                </p>
                <h2 id="playlist-title" className="mt-1 text-xl font-black tracking-[-0.03em]" data-testid="text-playlist-title">
                  {playlist?.title || "Your playlist is warming up"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground" data-testid="text-playlist-summary">
                  {playlist?.summary || "Generate a model to see song cards, play controls, and music-service links."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-10 rounded-full"
                  onClick={sharePlaylist}
                  disabled={!playlist}
                  data-testid="button-share"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => playlist && navigator.clipboard.writeText(window.location.href)}
                  disabled={!playlist}
                  aria-label="Copy demo link"
                  data-testid="button-copy-link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  playlist?.source === "spotify"
                    ? "bg-green-500/10 text-green-700 dark:text-green-300"
                    : "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                }`}
                data-testid="status-source"
              >
                {playlist?.source === "spotify" ? "Live Spotify seed" : "Apollo model"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Baby className="h-3.5 w-3.5" />
                Clean filter available for family listening
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {playlistMutation.isPending ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SkeletonPlaylist />
              </motion.div>
            ) : playlist ? (
              <motion.div key="playlist" className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {playlist.tracks.map((track, index) => (
                  <TrackCard
                    key={`${track.id}-${index}`}
                    track={track}
                    index={index}
                    provider={selectedProvider}
                    activePreview={activePreview}
                    onPreview={playTrack}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="rounded-[2rem] border border-dashed border-border bg-card/70 p-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                data-testid="status-empty"
              >
                <Music2 className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-black">No mix yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Add a seed song and pick one or two filters. The first playlist appears here.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={PlaylistApp} />
      <Route component={PlaylistApp} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
