# TikTok to MP3 🎵

Une application web moderne, rapide et élégante pour extraire la piste audio (au format MP3) de n'importe quelle vidéo TikTok.

## ✨ Fonctionnalités

- **Design Premium** : Interface épurée avec effet Glassmorphism et mode sombre (Dark Mode).
- **Architecture Hybride (Client-Side Processing)** : Utilise la puissance du navigateur de l'utilisateur (via WebAssembly) pour la conversion audio. Le serveur n'est utilisé que comme proxy, ce qui garantit des performances optimales et des coûts serveurs très faibles.
- **Conversion Haute Qualité** : Extraction de l'audio natif sans perte de qualité avec le puissant moteur `yt-dlp` et `ffmpeg.wasm`.
- **Aucun stockage de données** : Respect de la vie privée. Les vidéos transitent uniquement en mémoire vive (RAM) et aucun fichier n'est conservé.

## 🛠️ Technologies Utilisées

- **Framework** : [Next.js](https://nextjs.org/) (App Router)
- **Frontend** : React, CSS Vanilla (Polices : Inter & Outfit)
- **Traitement Backend** : [yt-dlp](https://github.com/yt-dlp/yt-dlp) (via `youtube-dl-exec`)
- **Conversion Audio** : [FFmpeg WebAssembly](https://ffmpegwasm.netlify.app/) (`@ffmpeg/ffmpeg`)



