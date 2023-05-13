/* eslint-disable @typescript-eslint/no-explicit-any */
module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    const guilds = client.guilds.cache;
    const serverArray: Array<any> = [];

    //populate server names and guild ids
    guilds.forEach(async (guild) => {
      //in cache ?
      if (!guild.available) {
        //fetch
        await guild.fetch();
      }
      serverArray.push({
        name: guild.name,
        id: guild.id,
      });
    });

    const serverList = serverArray.map((server) => {
      return `${server.name} (${server.id})`;
    });

    client.logger.info(`NPC-Quests v${client.version} ready !`);
    client.logger.info(
      `Logged in as ${client.user.tag} on ${guilds.size
      } servers: ${serverList.join(', ')}`
    );
    if (client.config.INVISIBLE) {
      client.user.setStatus('invisible');
      client.logger.warn('Bot status set to invisible !');
    }
  },
};
