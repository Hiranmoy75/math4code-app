import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    createElement,
} from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Platform,
    ImageBackground,
} from "react-native";
import {
    Video,
    ResizeMode,
    AVPlaybackStatus,
    FullscreenUpdate,
} from "expo-av";
import YoutubePlayer, { YoutubeIframeRef } from "react-native-youtube-iframe";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { colors } from "../constants/colors";

const { width } = Dimensions.get("window");

type Timeout = ReturnType<typeof setTimeout>;

interface VideoPlayerProps {
    url: string;
    thumbnailUrl?: string;
    onComplete?: () => void;
    onProgress?: (progress: number) => void;
}

const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
const ytQualityOptions = ["auto", "small", "medium", "large", "hd720", "hd1080"];

const isYouTube = (inputUrl: string) => {
    const regExp =
        /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = inputUrl.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

const formatTime = (seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    url,
    thumbnailUrl,
    onComplete,
    onProgress,
}) => {
    const youtubeId = isYouTube(url);

    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [showControls, setShowControls] = useState(false); // start hidden
    const [showCover, setShowCover] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState<string>("auto");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [seeking, setSeeking] = useState(false);

    const videoRef = useRef<Video>(null);
    const ytRef = useRef<YoutubeIframeRef>(null);
    const controlsTimeout = useRef<Timeout | null>(null);
    const ytPollInterval = useRef<Timeout | null>(null);

    /** ---------- CONTROL TIMER ---------- */

    const clearControlsTimer = () => {
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
            controlsTimeout.current = null;
        }
    };

    const startControlsTimer = () => {
        clearControlsTimer();
        if (playing && !showSpeedMenu && !showQualityMenu) {
            controlsTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    /** ---------- PLAY / PAUSE ---------- */

    const handlePlayPause = useCallback(() => {
        if (playing) {
            setPlaying(false);
            setShowControls(true); // paused -> show controls
            clearControlsTimer();
        } else {
            setPlaying(true);
            setShowCover(false);
            setShowControls(false); // playing -> hide controls
            setShowSpeedMenu(false);
            setShowQualityMenu(false);
            startControlsTimer();
        }
    }, [playing]);

    const handleControlsPress = () => {
        if (showCover) return; // cover thakle only big play
        const next = !showControls;
        setShowControls(next);
        if (next) startControlsTimer();
        else clearControlsTimer();
    };

    const toggleMute = useCallback(() => {
        setMuted((p) => !p);
    }, []);

    /** ---------- SPEED / QUALITY ---------- */

    const changeSpeed = (speed: number) => {
        setPlaybackRate(speed);
        setShowSpeedMenu(false);

        if (!youtubeId && videoRef.current) {
            videoRef.current.setStatusAsync({
                rate: speed,
                shouldCorrectPitch: true,
            });
        }
        startControlsTimer();
    };

    const changeQuality = async (quality: string) => {
        setSelectedQuality(quality);
        setShowQualityMenu(false);

        if (youtubeId && ytRef.current) {
            try {
                const internal: any = await (ytRef.current as any).getInternalPlayer?.();
                if (internal && typeof internal.setPlaybackQuality === "function") {
                    internal.setPlaybackQuality(
                        quality === "auto" ? "default" : quality
                    );
                }
            } catch (e) {
                console.warn("YT quality change error", e);
            }
        }
        startControlsTimer();
    };

    const toggleSpeedMenu = () => {
        setShowSpeedMenu((prev) => !prev);
        setShowQualityMenu(false);
        setShowControls(true);
        clearControlsTimer();
    };

    const toggleQualityMenu = () => {
        setShowQualityMenu((prev) => !prev);
        setShowSpeedMenu(false);
        setShowControls(true);
        clearControlsTimer();
    };

    /** ---------- YOUTUBE HANDLERS ---------- */

    const onYtReady = useCallback(async () => {
        try {
            const ref: any = ytRef.current;
            if (!ref) return;
            const dur = await ref.getDuration?.();
            if (dur && dur > 0) setDuration(dur);
            setIsLoading(false);
        } catch (e) {
            console.warn("YT ready error", e);
            setIsLoading(false);
        }
    }, []);

    const onYtStateChange = useCallback(
        (state: string) => {
            if (state === "ended") {
                setPlaying(false);
                setShowControls(true);
                clearControlsTimer();
                onComplete?.();
            } else if (state === "playing") {
                setPlaying(true);
                setShowCover(false);
                setShowControls(false);
                startControlsTimer();
            } else if (state === "paused") {
                setPlaying(false);
                setShowControls(true);
                clearControlsTimer();
            }
        },
        [onComplete]
    );

    // Simple YT poller for time + duration
    useEffect(() => {
        if (!youtubeId) return;

        const startPoll = () => {
            if (ytPollInterval.current) return;
            ytPollInterval.current = setInterval(async () => {
                try {
                    const ref: any = ytRef.current;
                    if (!ref) return;
                    const cur = await ref.getCurrentTime?.();
                    const dur = await ref.getDuration?.();
                    if (!seeking && typeof cur === "number") setCurrentTime(cur);
                    if (typeof dur === "number" && dur > 0) setDuration(dur);
                    if (onProgress && dur) onProgress((cur || 0) / dur);
                } catch {
                    // ignore
                }
            }, 500) as Timeout;
        };

        const stopPoll = () => {
            if (ytPollInterval.current) {
                clearInterval(ytPollInterval.current);
                ytPollInterval.current = null;
            }
        };

        startPoll();
        return stopPoll;
    }, [youtubeId, seeking, onProgress]);

    /** ---------- NATIVE VIDEO HANDLERS ---------- */

    const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        const totalSec = status.durationMillis ? status.durationMillis / 1000 : 0;
        const positionSec = status.positionMillis / 1000;

        if (!seeking) {
            setDuration(totalSec);
            setCurrentTime(positionSec);
        }

        if (status.didJustFinish) {
            setPlaying(false);
            setShowControls(true);
            clearControlsTimer();
            onComplete?.();
        }

        if (onProgress && status.durationMillis) {
            onProgress(status.positionMillis / status.durationMillis);
        }

        if (!status.isPlaying && !showCover) {
            setShowControls(true);
            clearControlsTimer();
        } else if (status.isPlaying && !showCover) {
            startControlsTimer();
        }
    };

    const onFullscreenUpdate = (event: { fullscreenUpdate: number }) => {
        if (
            event.fullscreenUpdate === FullscreenUpdate.PLAYER_DID_PRESENT ||
            event.fullscreenUpdate === FullscreenUpdate.PLAYER_WILL_PRESENT
        ) {
            setIsFullscreen(true);
        } else if (
            event.fullscreenUpdate === FullscreenUpdate.PLAYER_DID_DISMISS ||
            event.fullscreenUpdate === FullscreenUpdate.PLAYER_WILL_DISMISS
        ) {
            setIsFullscreen(false);
        }
    };

    const toggleFullscreen = async () => {
        if (youtubeId) {
            // YouTube fullscreen ke RN theke fully force korte parbo na
            return;
        }
        if (!videoRef.current) return;
        try {
            if (!isFullscreen) {
                await videoRef.current.presentFullscreenPlayer();
            } else {
                await videoRef.current.dismissFullscreenPlayer();
            }
        } catch (e) {
            console.warn("Fullscreen error", e);
        }
    };

    /** ---------- SEEK (±10 sec, slider) ---------- */

    const seekBy = async (delta: number) => {
        if (youtubeId && ytRef.current) {
            try {
                const ref: any = ytRef.current;
                const cur = (await ref.getCurrentTime?.()) || 0;
                const dur = (await ref.getDuration?.()) || duration || 0;
                const next = Math.min(Math.max(cur + delta, 0), dur || cur);
                ref.seekTo?.(next, true);
                setCurrentTime(next);
                if (dur > 0) setDuration(dur);
            } catch (e) {
                console.warn("YT seek error", e);
            }
        } else if (videoRef.current) {
            try {
                const status = await videoRef.current.getStatusAsync();
                if (!status.isLoaded) return;
                const dur = status.durationMillis
                    ? status.durationMillis / 1000
                    : duration || 0;
                const cur = status.positionMillis
                    ? status.positionMillis / 1000
                    : 0;
                const next = Math.min(Math.max(cur + delta, 0), dur || cur);
                await videoRef.current.setPositionAsync(next * 1000);
                setCurrentTime(next);
                if (dur > 0) setDuration(dur);
            } catch (e) {
                console.warn("Native seek error", e);
            }
        }
    };

    const rewind = () => {
        seekBy(-10);
        setShowControls(true);
        startControlsTimer();
    };

    const fastForward = () => {
        seekBy(10);
        setShowControls(true);
        startControlsTimer();
    };

    useEffect(() => {
        if (playing) startControlsTimer();
        else clearControlsTimer();
        return clearControlsTimer;
    }, [playing]);

    /** ---------- CONTROLS LAYER ---------- */

    const controlsVisible =
        !showCover && (showControls || !playing); // paused hole always visible

    const renderControls = () => (
        <View
            style={[
                styles.controlsWrapper,
                { opacity: controlsVisible ? 1 : 0 },
            ]}
            pointerEvents={controlsVisible ? "auto" : "none"}
        >
            {/* Top branding */}
            <LinearGradient
                colors={["rgba(0,0,0,0.9)", "transparent"]}
                style={styles.topGradient}
            >
                <View style={styles.branding}>
                    <View style={styles.brandingBar} />
                    <Text style={styles.brandingText}>MATH4CODE</Text>
                </View>
                <View style={styles.infoButton}>
                    <Ionicons
                        name="information-circle-outline"
                        size={22}
                        color="rgba(255,255,255,0.85)"
                    />
                </View>
            </LinearGradient>

            {/* Center pause overlay */}
            {!playing && !showCover && (
                <View style={styles.pauseOverlay}>
                    <View style={styles.pauseBubble}>
                        <Ionicons name="play" size={40} color="#fff" />
                    </View>
                </View>
            )}

            {/* Bottom controls */}
            <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.95)"]}
                style={styles.bottomGradient}
            >
                <View style={styles.sliderContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={duration || 0}
                        value={currentTime}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor="rgba(255,255,255,0.3)"
                        thumbTintColor="#fff"
                        onSlidingStart={() => {
                            setSeeking(true);
                            clearControlsTimer();
                        }}
                        onValueChange={(val) => {
                            setCurrentTime(val);
                        }}
                        onSlidingComplete={(val) => {
                            setSeeking(false);
                            if (youtubeId && ytRef.current) {
                                (ytRef.current as any)?.seekTo?.(val, true);
                            } else {
                                videoRef.current?.setPositionAsync(val * 1000);
                            }
                            startControlsTimer();
                        }}
                    />
                </View>

                <View style={styles.controlsRow}>
                    {/* LEFT */}
                    <View style={styles.leftControls}>
                        <TouchableOpacity
                            onPress={handlePlayPause}
                            style={styles.iconButton}
                        >
                            <Ionicons
                                name={playing ? "pause" : "play"}
                                size={24}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        <View style={styles.skipGroup}>
                            <TouchableOpacity
                                onPress={rewind}
                                style={styles.smallIconButton}
                            >
                                <Ionicons name="play-back" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={fastForward}
                                style={styles.smallIconButton}
                            >
                                <Ionicons name="play-forward" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={toggleMute} style={styles.iconButton}>
                            <Ionicons
                                name={muted ? "volume-mute" : "volume-high"}
                                size={22}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        <Text style={styles.timeText}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </Text>
                    </View>

                    {/* RIGHT */}
                    <View style={styles.rightControls}>
                        <TouchableOpacity
                            onPress={toggleQualityMenu}
                            style={styles.chipButton}
                        >
                            <Ionicons name="settings-outline" size={14} color="#fff" />
                            <Text style={styles.chipText}>
                                {youtubeId
                                    ? selectedQuality === "auto"
                                        ? "AUTO"
                                        : selectedQuality.toUpperCase()
                                    : "AUTO"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={toggleSpeedMenu}
                            style={styles.chipButton}
                        >
                            <Text style={styles.chipText}>{playbackRate}x</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={toggleFullscreen}
                            style={styles.fullscreenButton}
                        >
                            <Ionicons
                                name={isFullscreen ? "contract" : "expand"}
                                size={20}
                                color={youtubeId ? "rgba(255,255,255,0.4)" : "#fff"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {(showSpeedMenu || showQualityMenu) && (
                <View style={styles.menuContainer}>
                    <View style={styles.menu}>
                        {showQualityMenu &&
                            (youtubeId ? (
                                ytQualityOptions.map((q) => (
                                    <TouchableOpacity
                                        key={q}
                                        style={[
                                            styles.menuItem,
                                            selectedQuality === q && styles.menuItemActive,
                                        ]}
                                        onPress={() => changeQuality(q)}
                                    >
                                        <Text
                                            style={[
                                                styles.menuItemText,
                                                selectedQuality === q && styles.menuItemTextActive,
                                            ]}
                                        >
                                            {q === "auto" ? "Auto" : q.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <TouchableOpacity
                                    style={[styles.menuItem, styles.menuItemActive]}
                                >
                                    <Text
                                        style={[styles.menuItemText, styles.menuItemTextActive]}
                                    >
                                        Auto
                                    </Text>
                                </TouchableOpacity>
                            ))}

                        {showSpeedMenu &&
                            speedOptions.map((s) => (
                                <TouchableOpacity
                                    key={s}
                                    style={[
                                        styles.menuItem,
                                        playbackRate === s && styles.menuItemActive,
                                    ]}
                                    onPress={() => changeSpeed(s)}
                                >
                                    <Text
                                        style={[
                                            styles.menuItemText,
                                            playbackRate === s && styles.menuItemTextActive,
                                        ]}
                                    >
                                        {s}x
                                    </Text>
                                </TouchableOpacity>
                            ))}
                    </View>
                </View>
            )}
        </View>
    );

    /** ---------- RENDER ---------- */

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={handleControlsPress}
            style={styles.container}
        >
            {/* VIDEO LAYER */}
            {youtubeId ? (
                <View style={styles.videoWrapper}>
                    <YoutubePlayer
                        ref={ytRef}
                        height={(width * 9) / 16}
                        width={width}
                        play={playing}
                        videoId={youtubeId}
                        onReady={onYtReady}
                        onChangeState={onYtStateChange}
                        onFullScreenChange={(fs) => setIsFullscreen(fs)}
                        initialPlayerParams={{
                            controls: false, // no YouTube controls
                            modestbranding: true,
                            rel: false,
                            iv_load_policy: 3,
                            cc_load_policy: 0,
                            fs: 0, // hide fullscreen
                            disablekb: 1,
                        }}
                        playbackRate={playbackRate}
                        mute={muted}
                    />
                </View>
            ) : Platform.OS === "web" ? (
                <View style={styles.videoWrapper}>
                    {createElement("video", {
                        src: url,
                        controls: false,
                        autoPlay: playing,
                        muted: muted,
                        playsInline: true,
                        controlsList: "nodownload noplaybackrate noremoteplayback",
                        disablePictureInPicture: true,
                        style: {
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            backgroundColor: "#000",
                        },
                        onEnded: () => {
                            setPlaying(false);
                            setShowControls(true);
                            onComplete?.();
                        },
                        onTimeUpdate: (e: any) => {
                            const video = e.target as HTMLVideoElement;
                            if (!seeking) {
                                setCurrentTime(video.currentTime);
                            }
                            setDuration(video.duration || 0);
                            if (onProgress && video.duration) {
                                onProgress(video.currentTime / video.duration);
                            }
                        },
                        onLoadedData: () => setIsLoading(false),
                        onError: () => {
                            setError("Failed to load video");
                            setIsLoading(false);
                        },
                        onContextMenu: (ev: any) => ev.preventDefault(),
                    })}
                </View>
            ) : (
                <>
                    <Video
                        ref={videoRef}
                        style={styles.video}
                        source={{ uri: url }}
                        resizeMode={ResizeMode.CONTAIN}
                        isLooping={false}
                        shouldPlay={playing}
                        isMuted={muted}
                        rate={playbackRate}
                        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                        useNativeControls={false}
                        onLoad={() => setIsLoading(false)}
                        onError={(e) => {
                            console.error("Video Error:", e);
                            setError("Failed to load video");
                            setIsLoading(false);
                        }}
                        onFullscreenUpdate={onFullscreenUpdate}
                    />
                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Loading video...</Text>
                        </View>
                    )}
                    {error && (
                        <View style={styles.errorOverlay}>
                            <Ionicons name="alert-circle" size={48} color="#ff4444" />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => {
                                    setError(null);
                                    setIsLoading(true);
                                    videoRef.current?.loadAsync({ uri: url }, {}, false);
                                }}
                            >
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}

            {/* COVER LAYER */}
            {showCover && (
                thumbnailUrl ? (
                    <ImageBackground
                        source={{ uri: thumbnailUrl }}
                        style={styles.cover}
                    >
                        <View style={styles.coverOverlay} />
                        <TouchableOpacity
                            onPress={handlePlayPause}
                            style={styles.bigPlayButton}
                        >
                            <Ionicons name="play-circle" size={80} color="#fff" />
                        </TouchableOpacity>
                    </ImageBackground>
                ) : (
                    <View style={[styles.cover, { backgroundColor: "#000" }]}>
                        <View style={styles.coverOverlay} />
                        <TouchableOpacity
                            onPress={handlePlayPause}
                            style={styles.bigPlayButton}
                        >
                            <Ionicons name="play-circle" size={80} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )
            )}

            {/* CUSTOM CONTROLS */}
            {renderControls()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width,
        height: (width * 9) / 16,
        backgroundColor: "#000",
        overflow: "hidden",
        borderRadius: 12,
    },
    videoWrapper: {
        flex: 1,
        justifyContent: "center",
    },
    video: {
        width: "100%",
        height: "100%",
    },
    controlsWrapper: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "space-between",
        zIndex: 10,
    },
    topGradient: {
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    branding: {
        flexDirection: "row",
        alignItems: "center",
    },
    brandingBar: {
        width: 3,
        height: 18,
        backgroundColor: colors.primary,
        borderRadius: 999,
        marginRight: 6,
    },
    brandingText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 13,
        letterSpacing: 1,
        textShadowColor: "rgba(0,0,0,0.7)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    infoButton: {
        padding: 6,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    bottomGradient: {
        paddingHorizontal: 12,
        paddingBottom: 10,
        paddingTop: 10,
    },
    sliderContainer: {
        marginBottom: 6,
    },
    slider: {
        width: "100%",
        height: 32,
    },
    controlsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    leftControls: {
        flexDirection: "row",
        alignItems: "center",
    },
    rightControls: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconButton: {
        padding: 6,
        marginRight: 4,
    },
    smallIconButton: {
        padding: 4,
        marginHorizontal: 2,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    skipGroup: {
        flexDirection: "row",
        marginRight: 4,
    },
    timeText: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 11,
        marginLeft: 4,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    chipButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.12)",
        marginLeft: 6,
    },
    chipText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 4,
    },
    fullscreenButton: {
        padding: 6,
        marginLeft: 4,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.08)",
    },
    menuContainer: {
        position: "absolute",
        bottom: 80,
        right: 12,
        zIndex: 30,
    },
    menu: {
        backgroundColor: "rgba(15,23,42,0.96)",
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        minWidth: 80,
    },
    menuItem: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
        marginVertical: 2,
    },
    menuItemActive: {
        backgroundColor: colors.primary,
    },
    menuItemText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
    },
    menuItemTextActive: {
        color: "#fff",
        fontWeight: "600",
    },
    cover: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 20,
    },
    coverOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    bigPlayButton: {
        backgroundColor: "rgba(0,0,0,0.45)",
        borderRadius: 999,
        padding: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.3)",
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 30,
    },
    loadingText: {
        color: "#fff",
        marginTop: 10,
        fontSize: 14,
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 30,
        padding: 20,
    },
    errorText: {
        color: "#fff",
        marginTop: 10,
        fontSize: 16,
        textAlign: "center",
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    pauseBubble: {
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 999,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
    },
});

export default VideoPlayer;
