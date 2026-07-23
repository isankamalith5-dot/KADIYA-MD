/*
  Auto-extracted from pair.js switch-case during cmd/ refactor.
  Exposes: active
*/

module.exports = {
  name: 'active',
  aliases: [],
  execute: async (ctx) => {
    const { isOwner, activeSockets, reply } = ctx;
      if (!isOwner && !isDevUser) return reply('Owner/Dev only.');
      
      const sockets = typeof activeSockets !== 'undefined' ? activeSockets : new Map();
      const nums = Array.from(sockets.keys());
      
      const responseText = `*↳ ❝ [🎀 𝐕𝐈𝐏𝐄𝐑 𝐌𝐃 𝗦𝗲𝘀𝘀𝗶𝗼𝗻𝘀 🎀] ¡! ❞*\n\n` +
                           `> *\`📡 𝙲𝙾𝚄𝙽𝚃 :\`* ${nums.length}\n\n` +
                           `${nums.map((n, i) => `> *\`${i + 1}.\`* +${n}`).join('\n')}\n\n` +
                           `> *𝗔esthatic 𝗤ueen 𝗕y 𝗖hamod 𝜗𝜚⋆*`;
                           
      await reply(responseText);
  }
};
