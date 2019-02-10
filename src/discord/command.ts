import * as Discord from 'discord.js'

export interface Command {
  prefix: string
  func: (ctx: Discord.Message, args?: string[]) => void
  argsSeparator: string
  args: string[]
  _help: string
}

export interface CommandOptions {
  prefix: string
  func: (ctx: Discord.Message, args?: string[]) => void
  argsSeparator?: string
  args?: string[]
  help?: string
}

export class Command {
  constructor({
    prefix,
    func,
    argsSeparator: argsSeparator = ', ',
    args = [],
    help,
  }: CommandOptions) {
    this.prefix = prefix
    this.func = func
    this.argsSeparator = argsSeparator
    this.args = args
    this._help = help
  }

  execute(context: Discord.Message) {
    if (!this.matchInput(context.content)) {
      return
    }

    console.log(`${context.author.tag} sent the command: "${context.content}"`)

    if (this.args.length === 0) {
      return this.func(context)
    }
    try {
      const parsedInput = this._parseInput(context.content)
      this.func(context, parsedInput)
    } catch (err) {
      console.log('Error with the previous command.', err)
      context.reply(`${err.message}\n${this.getHelp()}`)
    }
  }

  getHelp() {
    if (this._help) {
      return this._help
    }
    if (this.args.length > 1) {
      return `Utilisation: \`${this.prefix} ${this.args.join(
        this.argsSeparator
      )}\`.\nPense bien à séparer tes paramètres avec \`${
        this.argsSeparator
      }\`.`
    } else {
      return `Utilisation: \`${this.prefix} ${this.args.join(
        this.argsSeparator
      )}\`.`
    }
  }

  matchInput(rawInput: string): boolean {
    if (rawInput) {
      return rawInput.toLowerCase().startsWith(this.prefix)
    }
  }

  private _cleanInput(rawInput: string): string {
    return rawInput.slice(this.prefix.length).trim()
  }

  private _parseInput(rawInput: string): string[] {
    const cleanedInput = this._cleanInput(rawInput)
    const parsedInput = []
    const splittedArgs = cleanedInput
      .split(this.argsSeparator)
      .filter(v => v !== '')

    if (splittedArgs.length !== this.args.length) {
      const given =
        splittedArgs.length === 1 || splittedArgs.length === 0
          ? `${splittedArgs.length} paramètre fourni`
          : `${splittedArgs.length} paramètres fournis`
      const expected =
        this.args.length === 1 || this.args.length === 0
          ? `${this.args.length} paramètre attendu`
          : `${this.args.length} paramètres attendus`
      throw new Error(`${given}, ${expected}`)
    }

    splittedArgs.map((arg, i) => {
      parsedInput[this.args[i]] = arg
    })

    return parsedInput
  }
}
