/*
  Auto-extracted from pair.js switch-case during cmd/ refactor.
  Exposes: song  (aliases: ytmp3, music, video, ytv, yta)

  NOTE (fix): This used to call a private third-party API
  (whiteshadow-x-api.onrender.com) with a placeholder apitoken ("aWK0z4")
  that was never replaced with a real one. That API rejects every request
  with 401 Unauthorized, so the search always failed silently after the
  "🔍 Searching..." message — the request would error out (or hang, since
  no timeout was set) and only the generic internal-error text would ever
  show, if anything.

  Fix: use the "yt-search" package that's already a dependency in
  package.json (and already wired into pair.js's ctx as `yts`) to resolve
  the song/link locally. No external API, no token, no network round-trip
  to a possibly-sleeping free Render service — just faster and reliable.
*/

module.exports = {
  name: 'song',
  aliases: ["ytmp3", "music", "video", "ytv", "yta"],
  execute: async (ctx) => {
    const { socket, msg, sender, args, reply, yts } = ctx;
    try {
        const query = args.join(' ');
        if (!query) return reply("🎵 *කරුණාකර සින්දුවක නමක් හෝ YouTube ලින්ක් එකක් ලබා දෙන්න!*\n💡 උදා: `.song master sir` හෝ `.song <youtube link>`");

        try { await socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } }); } catch (_) {}

        let youtubeUrl = null;
        let songTitle = "Kadiya-X-MD Audio";
        let songThumb = "https://images.unsplash.com/photo-1614680376593-902f74fa0d41"; // Default fallback thumbnail
        let duration = "Unknown";
        let views = "Unknown";

        // 1. Check if input is a YouTube Link
        const regex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s?#]+)/i;
        const match = query.match(regex);

        if (match) {
            const link = match[0].trim();
            const idMatch = link.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
            const videoId = idMatch ? idMatch[1] : null;

            reply("🔗 _YouTube link detected. Fetching data..._");

            let info = null;
            if (videoId) {
                try { info = await yts({ videoId }); } catch (_) { info = null; }
            }

            if (info && info.videoId) {
                youtubeUrl = info.url || link;
                songTitle = info.title || songTitle;
                songThumb = info.thumbnail || info.image || songThumb;
                duration = info.timestamp || info.duration?.timestamp || duration;
                views = (info.views !== undefined && info.views !== null) ? Number(info.views).toLocaleString() : views;
            } else {
                // Couldn't fetch metadata, but we still have a valid link — proceed with it
                youtubeUrl = link;
            }
        } else {
            // It's a name search
            reply(`🔍 _Searching YouTube for: "${query}"..._`);

            const searchRes = await yts(query);
            const video = searchRes?.videos?.[0];

            if (video) {
                youtubeUrl = video.url;
                songTitle = video.title || songTitle;
                songThumb = video.thumbnail || video.image || songThumb;
                duration = video.timestamp || video.duration?.timestamp || duration;
                views = (video.views !== undefined && video.views !== null) ? Number(video.views).toLocaleString() : views;
            }
        }

        if (!youtubeUrl) {
            try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
            return reply("❌ *Error:* සින්දුව හෝ වීඩියෝව සොයා ගැනීමට නොහැකි විය!");
        }

        // 2. Buttons පණිවිඩය නිර්මාණය කිරීම (Baileys Interactive Buttons Format)
        // සටහන: නවතම WhatsApp updates වල Buttons පෙන්වීමට Template Buttons භාවිතා කරයි.

        const buttons = [
            {
                buttonId: `.download_audio ${youtubeUrl}`, // බොත්තම ක්ලික් කල විට trigger වන command එක
                buttonText: { displayText: '🎵 Audio (320kbps)' },
                type: 1
            },
            {
                buttonId: `.download_video ${youtubeUrl}`,
                buttonText: { displayText: '🎥 Video (720p)' },
                type: 1
            },
            {
                buttonId: `.download_doc ${youtubeUrl}`,
                buttonText: { displayText: '📂 Document (File)' },
                type: 1
            }
        ];

        const buttonMessage = {
            image: { url: songThumb },
            caption: `✨ *_👑𝗞ᴀᴅɪ𝗬𝗮-𝙓-𝙈𝘿🔥_ Music Downloader* ✨\n\n📌 *Title:* ${songTitle}\n🕒 *Duration:* ${duration}\n👁️ *Views:* ${views}\n🔗 *URL:* ${youtubeUrl}\n\n*පහත බොත්තම් භාවිතයෙන් ඔබට අවශ්‍ය Format එක තෝරාගන්න:*`,
            footer: '© Powerd By Kadiya-X-MD 🇱🇰',
            buttons: buttons,
            headerType: 4
        };

        await socket.sendMessage(sender, buttonMessage, { quoted: msg });
        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}

    } catch (e) {
        console.log("SONG CMD ERROR:", e);
        try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
        reply("❌ *Kadiya-X-MD Internal Error:* " + e.message);
    }
  }
};
