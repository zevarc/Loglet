/**
 * Embedded sample log — wired to the "Try a sample" button in InputPanel.
 *
 * Uses the Android Studio Logcat V2 copy format because that's what most
 * users encounter (they paste from AS's Logcat panel, not from raw adb).
 * Includes a crash with a Caused-by chain to showcase stack folding,
 * level coloring, package-name extraction, and tag aggregation in one
 * paste.
 */

export const SAMPLE_LOG = `2024-05-15 14:22:01.123  4242-4242  ActivityManager        com.example.app    I  Process com.example.app started for activity com.example.app/.DetailActivity
2024-05-15 14:22:01.230  4242-5012  NetworkClient          com.example.app    D  GET https://api.example.com/v1/items/7
2024-05-15 14:22:01.388  4242-5012  NetworkClient          com.example.app    I  200 OK · 188 bytes · 158ms
2024-05-15 14:22:01.456  4242-4242  ImageLoader            com.example.app    D  loading thumbnail for item#7
2024-05-15 14:22:01.480  4242-4242  Choreographer          com.example.app    W  Skipped 18 frames!  The application may be doing too much work on its main thread.
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  FATAL EXCEPTION: main
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  Process: com.example.app, PID: 4242
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  java.lang.NullPointerException: Attempt to invoke virtual method 'int java.lang.Integer.intValue()' on a null object reference
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  \tat com.example.app.detail.DetailFragment.bind(DetailFragment.java:88)
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  \tat com.example.app.detail.DetailFragment.onViewCreated(DetailFragment.java:62)
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  \tat androidx.fragment.app.Fragment.performViewCreated(Fragment.java:3097)
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  \tat androidx.fragment.app.FragmentStateManager.createView(FragmentStateManager.java:553)
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  Caused by: java.lang.IllegalStateException: Repository not initialized
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  \tat com.example.app.data.ItemRepository.get(ItemRepository.java:34)
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  \tat com.example.app.detail.DetailFragment.bind(DetailFragment.java:84)
2024-05-15 14:22:01.500  4242-4242  AndroidRuntime         com.example.app    E  \t... 8 more
2024-05-15 14:22:01.612  100-100    Process                ?                  I  Sending signal. PID: 4242 SIG: 9`;
