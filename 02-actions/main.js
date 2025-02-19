import "../style.css";

import { createMachine, assign, interpret, send } from "xstate";
import { raise } from "xstate/lib/actions";
import elements from "../utils/elements";
import { inspect } from "@xstate/inspect";

inspect({
  iframe: false,
  url: "https://stately.ai/viz?inspect",
});
const playerMachine = createMachine({
  predictableActionArguments: true,
  initial: "loading",
  states: {
    loading: {
      entry: "startPlaying",
      on: {
        LOADED: {
          actions: "assignSongData",
          target: "playing",
        },
      },
    },
    paused: {
      on: {
        PLAY: { target: "playing" },
      },
    },
    playing: {
      entry: "playAudio",
      exit: "pauseAudio",
      on: {
        PAUSE: { target: "paused" },
      },
    },
  },
  on: {
    SKIP: {
      actions: "skipSong",
      target: "loading",
    },
    LIKE: {
      actions: "likeSong",
    },
    UNLIKE: {
      actions: "unlikeSong",
    },
    DISLIKE: {
      actions: ["dislikeSong", raise("SKIP")],
    },
    VOLUME: {
      actions: "assignVolume",
    },
  },
}).withConfig({
  actions: {
    assignSongData: () => {},
    likeSong: () => {},
    unlikeSong: () => {},
    dislikeSong: () => {},
    skipSong: () => {},
    assignVolume: () => {},
    assignTime: () => {},
    playAudio: () => {},
    pauseAudio: () => {},
    startPlaying: () => {
      console.info("starts playing song");
      raise("LOADED");
    },
  },
});

elements.elPlayButton.addEventListener("click", () => {
  service.send({ type: "PLAY" });
});

elements.elPauseButton.addEventListener("click", () => {
  service.send({ type: "PAUSE" });
});

elements.elSkipButton.addEventListener("click", () => {
  service.send({ type: "SKIP" });
});

elements.elLikeButton.addEventListener("click", () => {
  service.send({ type: "LIKE" });
});

elements.elDislikeButton.addEventListener("click", () => {
  service.send({ type: "DISLIKE" });
});

const service = interpret(playerMachine, { devTools: true }).start();

service.subscribe((state) => {
  console.table(state.event);

  elements.elLoadingButton.hidden = !state.matches("loading");

  elements.elPlayButton.hidden = !state.can({ type: "PLAY" });

  elements.elPauseButton.hidden = !state.can({ type: "PAUSE" });
});

service.send("LOADED");
