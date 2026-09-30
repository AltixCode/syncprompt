import type { VideoQuality } from "expo-camera";

/**
 * The recording-ratio presets the prompter screen offers.
 *
 * expo-camera's `CameraView` does not expose a frame-rate control at all --
 * there is no `fps` prop on the view and no `fps` option on `recordAsync`, on
 * either platform. Getting real FPS control would mean dropping past this
 * library to a native module of our own, which is a much larger undertaking
 * than this fix and is deliberately left out; see HANDOFF.md. Aspect ratio,
 * unlike frame rate, maps directly onto `videoQuality`, so it is offered as a
 * simple two-way preset rather than a free-form picker.
 */
export const VIDEO_RATIOS = ["16:9", "4:3"] as const;
export type VideoRatio = (typeof VIDEO_RATIOS)[number];

/** Maps a ratio preset to the `videoQuality` CameraView actually accepts. */
export const ratioToVideoQuality = (ratio: VideoRatio): VideoQuality =>
  ratio === "4:3" ? "4:3" : "1080p";
