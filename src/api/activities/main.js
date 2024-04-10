import { DiscordSDK } from '@discord/embedded-app-sdk';
const discordSdk = new DiscordSDK('1125509497079726182');

let auth;

setupDiscordSdk().then(() => {
  setInfo();
});

async function setupDiscordSdk () {
  document.querySelector('status').textContent = 'loading';
  await discordSdk.ready();
  document.querySelector('status').textContent = 'ready';

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: '1125509497079726182',
    response_type: 'code',
    state: '',
    prompt: 'none',
    // More info on scopes here: https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
    scope: [
      'identify',
      'guilds',
      'rpc.voice.read'
    ]
  });

  // Retrieve an access_token from your activity's server
  const { access_token: accessToken } = await fetch('https://api.rubixbot.com/activities/token', {
    method: 'POST',
    body: { code }
  }).then(resp => resp.json());

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token: accessToken
  });

  if (auth === null) {
    document.querySelector('errors').textContent = 'auth failure';
  } else {
    document.querySelector('errors').textContent = 'auth success';
  }
}

async function setInfo () {
  const channel = await discordSdk.commands.getChannel({ channel_id: discordSdk.channelId });
  if (channel.name !== null) {
    document.querySelector('channelName').textContent = channel.name;
  }

  const guilds = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json'
    }
  }).then(reply => reply.json());

  // 2. Find the current guild's info, including it's "icon"
  const currentGuild = guilds.find(g => g.id === discordSdk.guildId);
  if (currentGuild !== null) {
    document.querySelector('guildName').textContent = currentGuild.name;
  } else {
    document.querySelector('guildName').textContent = 'DM';
  }
}
