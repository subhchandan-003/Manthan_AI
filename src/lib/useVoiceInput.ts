"use client";

import { useCallback } from "react";

type SpeechRecognitionLike = {
  lang: string;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  start: () => void;
};

/** Real Web Speech API voice input, shared by every mic button in the app — no decorative-only mics. */
export function useVoiceInput(onResult: (text: string) => void) {
  return useCallback(() => {
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognitionCtor = w.webkitSpeechRecognition ?? w.SpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-IN";
    recognition.onresult = (e) => {
      onResult(e.results[0][0].transcript);
    };
    recognition.start();
  }, [onResult]);
}
