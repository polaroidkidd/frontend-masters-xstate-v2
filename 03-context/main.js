import "../style.css";

import { createMachine, assign, interpret, send } from "xstate";
import elements from "../utils/elements";
import { raise } from "xstate/lib/actions";
import { formatTime } from "../utils/formatTime";

const playerMachine = createMachine({
  initial: "loading",
  context: {
    title: "",
    artist: "",
    duration: -1,
    likeStatus: "unliked",
    elapsed: 0,
    volume: 0,
    // Add initial context here for:
    // title, artist, duration, elapsed, likeStatus, volume
  },
  states: {
    loading: {
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
    "AUDIO.TIME": {
      actions: "assignTime",
    },
  },
}).withConfig({
  actions: {
    assignSongData: assign({
      artist: (_, event) => event.data.artist,
      title: (_, event) => event.data.title,
      duration: (_, event) => event.data.duration,
      likeStatus: "unliked",
      elapsed: 0,
    }),
    likeSong: assign({
      likeStatus: "liked",
    }),
    unlikeSong: assign({
      likeStatus: "unliked",
    }),
    dislikeSong: assign({
      likeStatus: "disliked",
    }),
    assignVolume: assign({
      volume: (ctx, event) => ctx.volume + event.level,
    }),
    assignTime: assign({
      // Assign the `elapsed` value to the `currentTime` from the event.
      // Assume the event looks like this:
      // {
      //   type: 'AUDIO.TIME',
      //   currentTime: 10
      // }
    }),
    skipSong: () => {
      console.log("Skipping song");
    },
    playAudio: () => {},
    pauseAudio: () => {},
  },
});

const service = interpret(playerMachine).start();
window["service"] = service;

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

elements.elVolumeButton?.addEventListener("click", () => {
  service.send({
    type: "VOLUME",
    level: service.machine.context.volume + 1,
  });
});

service.subscribe((state) => {
  console.log(state.context);
  const { context } = state;

  elements.elLoadingButton.hidden = !state.hasTag("loading");

  elements.elPlayButton.hidden = !state.can({ type: "PLAY" });

  elements.elPauseButton.hidden = !state.can({ type: "PAUSE" });

  elements.elVolumeButton.dataset.level =
    context.volume === 0
      ? "zero"
      : context.volume <= 2
      ? "low"
      : context.volume >= 8
      ? "high"
      : undefined;

  elements.elScrubberInput.setAttribute("max", context.duration);

  elements.elScrubberInput.value = context.elapsed;

  elements.elElapsedOutput.innerHTML = formatTime(
    context.elapsed - context.duration
  );

  elements.elLikeButton.dataset.likeStatus = context.likeStatus;

  elements.elArtist.innerHTML = context.artist;

  elements.elTitle.innerHTML = context.title;
});

service.send({
  type: "LOADED",
  data: {
    title: "Some song title",
    artist: "Some song artist",
    duration: 100,
  },
});
