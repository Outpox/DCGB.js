import * as dotenv from 'dotenv'
dotenv.config()

import { DoodleParser } from './doodleParser/parser'
import { Command } from './discord/command'
import * as Discord from 'discord.js'

const client = new Discord.Client()
const parser = new DoodleParser(process.env.DOODLE_ID)

const commandBag = [
  new Command({
    prefix: '!gb_game',
    func: (ctx, args) => {
      ctx.channel.send(parser.getUsersForGame(args['jeu']))
    },
    args: ['jeu'],
  }),
  new Command({
    prefix: '!gb_player',
    func: (ctx, args) => {
      ctx.channel.send(parser.getGamesForUser(args['pseudo']))
    },
    args: ['pseudo'],
  }),
  new Command({
    prefix: '!gb_update',
    func: async ctx => {
      await parser.loadData()
      ctx.channel.send('Base de données mise à jour.')
    },
  }),
  new Command({
    prefix: '!gb_doodle',
    func: async ctx => {
      ctx.channel.send(parser.getDoodleUrl())
    },
  }),
]

client.on('ready', async () => {
  console.log('Bot ready!')
  await parser.loadData()
})

client.on('message', message => {
  // console.log(message)
  if (message.author.id !== client.user.id) {
    commandBag.map(cmd => {
      cmd.execute(message)
    })
  }
})

client.login(process.env.DISCORD_KEY)

// https://discordapp.com/oauth2/authorize?client_id=482484858413645837&permissions=3072&scope=bot
