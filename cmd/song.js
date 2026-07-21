/*
  Auto-extracted from pair.js switch-case during cmd/ refactor.
  Exposes: song  (aliases: ytmp3, music, video, ytv, yta)
*/

module.exports = {
  name: 'song',
  aliases: ["ytmp3", "music", "video", "ytv", "yta"],
  execute: async (ctx) => {
    const { socket, msg, sender, args, command, quoted, text, type, reply, images, axios } = ctx;
    try {
        const query = args.join(' ');
        if (!query) return reply("🎵 *කරුණාකර සින්දුවක නමක් හෝ YouTube ලින්ක් එකක් ලබා දෙන්න!*\n💡 උදා: `.song master sir` හෝ `.song <youtube link>`");

        try { await socket.sendMessage(sender, { react: { text: '🔎', key: msg.key } }); } catch (_) {}

        // WhiteShadow YT APIs & Token
        const API_TOKEN = "aWK0z4"; // API එකෙහි නිවැරදි Token එක මෙහි ඇතුලත් කරන්න
        const YT_SEARCH_API = "https://whiteshadow-x-api.onrender.com/api/search/yt";
        
        let youtubeUrl = null;
        let songTitle = "Sadew-MD Audio";
        let songThumb = "https://images.unsplash.com/photo-1614680376593-902f74fa0d41"; // Default fallback thumbnail
        let duration = "Unknown";
        let views = "Unknown";

        // 1. Check if input is a YouTube Link
        const regex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s?#]+)/i;
        const match = query.match(regex);

        if (match) {
            youtubeUrl = match[0].trim();
            reply("🔗 _YouTube link detected. Fetching data from server..._");
            
            // ලින්ක් එකක් නම්, එහි තොරතුරු සෙවීමට search api එකට query එක ලෙස ලින්ක් එක යවන්න පුළුවන් (API එක support කරන්නේ නම්)
            const searchRes = await axios.get(`${YT_SEARCH_API}?q=${encodeURIComponent(youtubeUrl)}&apitoken=${API_TOKEN}`);
            if (searchRes.data && searchRes.data.success && searchRes.data.result.length > 0) {
                songTitle = searchRes.data.result[0].title || songTitle;
                songThumb = searchRes.data.result[0].thumbnail || songThumb;
                duration = searchRes.data.result[0].duration || duration;
                views = searchRes.data.result[0].views || views;
            }
        } else {
            // It's a name search
            reply(`🔍 _Searching YouTube for: "${query}"..._`);
            const searchRes = await axios.get(`${YT_SEARCH_API}?q=${encodeURIComponent(query)}&apitoken=${API_TOKEN}`);

            if (searchRes.data && searchRes.data.success && searchRes.data.result.length > 0) {
                youtubeUrl = searchRes.data.result[0].url;
                songTitle = searchRes.data.result[0].title || songTitle;
                songThumb = searchRes.data.result[0].image || searchRes.data.result[0].thumbnail || songThumb;
                duration = searchRes.data.result[0].timestamp || searchRes.data.result[0].duration || duration;
                views = searchRes.data.result[0].views || views;
            }
        }

        if (!youtubeUrl) {
            try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
            return reply("❌ *Error:* සින්දුව හෝ වීඩියෝව සොයා ගැනීමට නොහැකි විය!");
        }

        // 2. Thumbnail + song info (sent as a normal image/caption message —
        //    this part always renders fine, it's not the button system).
        try {
            await socket.sendMessage(sender, {
                image: { url: songThumb },
                caption: `✨ *_👑𝗞ᴀᴅɪ𝗬𝗮-𝙓-𝙈𝘿🔥_ Music Downloader* ✨\n\n📌 *Title:* ${songTitle}\n🕒 *Duration:* ${duration}\n👁️ *Views:* ${views}\n🔗 *URL:* ${youtubeUrl}`,
            }, { quoted: msg });
        } catch (thumbErr) {
            console.error('[song] thumbnail send failed:', thumbErr);
        }

        // 3. Interactive buttons — modern WhatsApp "native flow" format.
        // NOTE: The old `buttons` + `headerType` template-message format
        // (used previously here) was deprecated by WhatsApp itself and is
        // simply not rendered by current WhatsApp clients anymore for
        // regular (non business-API) accounts — this is true no matter
        // where the bot is hosted (Heroku or otherwise). The fix is to
        // switch to the interactiveMessage/nativeFlowMessage format, which
        // is the same pattern already working in cmd/emoji.js, and which
        // the incoming-message parser in pair.js already knows how to read
        // (see the `interactiveResponseMessage` handling there).
        const buttonMessage = {
            interactiveMessage: {
                body: { text: '*පහත බොත්තම් භාවිතයෙන් ඔබට අවශ්‍ය Format එක තෝරාගන්න:* 🎧' },
                footer: { text: '© Powerd By Kadiya-X-MD 🇱🇰' },
                header: { hasMediaAttachment: false },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🎵 Audio (320kbps)',
                                id: `.download_audio ${youtubeUrl}`,
                            }),
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '🎥 Video (720p)',
                                id: `.download_video ${youtubeUrl}`,
                            }),
                        },
                        {
                            name: 'quick_reply',
                            buttonParamsJson: JSON.stringify({
                                display_text: '📂 Document (File)',
                                id: `.download_doc ${youtubeUrl}`,
                            }),
                        },
                    ],
                    messageVersion: 1,
                },
            },
        };

        try {
            await socket.sendMessage(sender, { viewOnceMessage: { message: buttonMessage } }, { quoted: msg });
        } catch (btnErr) {
            // Fail-safe: if the interactive message is ever rejected, fall
            // back to plain numbered text so the user is never stuck.
            console.error('[song] button message failed, falling back to text:', btnErr);
            await socket.sendMessage(sender, {
                text: `🎧 *Format එකක් තෝරාගැනීමට පහත command එකක් type කරන්න:*\n\n1️⃣ .download_audio ${youtubeUrl}\n2️⃣ .download_video ${youtubeUrl}\n3️⃣ .download_doc ${youtubeUrl}`,
            }, { quoted: msg });
        }

        try { await socket.sendMessage(sender, { react: { text: '✅', key: msg.key } }); } catch (_) {}

    } catch (e) {
        console.log("SONG CMD ERROR:", e);
        try { await socket.sendMessage(sender, { react: { text: '❌', key: msg.key } }); } catch (_) {}
        reply("❌ *Kadiya-X-MD Internal Error:* " + e.message);
    }
  }
};
