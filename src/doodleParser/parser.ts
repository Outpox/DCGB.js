import { DoodleResponse } from './response'
import { Guess } from './guess'
import Axios, { AxiosResponse } from 'axios'
import * as jslevenshtein from 'js-levenshtein'

const API_URL: string = 'https://doodle.com/api/v2.0/polls/'
const DOODLE_URL: string = 'https://doodle.com/poll/'
const MAX_DISTANCE_ALLOWED = 2

export interface DoodleParser {
  pollId: string
  parsedResponse: DoodleResponse
}

export class DoodleParser {
  constructor(id: string) {
    this.pollId = id
  }

  async loadData() {
    const response = (await Axios.get(API_URL + this.pollId)) as AxiosResponse<
      object
    >
    this.parsedResponse = response.data as DoodleResponse
  }

  getDoodleUrl() {
    return DOODLE_URL + this.pollId
  }

  getUser(username: string): Guess | null {
    let candidates: Guess[] = []

    for (let i = 0; i < this.parsedResponse.participantsCount; i++) {
      const user = this.parsedResponse.participants[i]
      const distance: number = jslevenshtein(
        user.name.toLowerCase(),
        username.toLowerCase()
      )
      if (distance <= MAX_DISTANCE_ALLOWED) {
        candidates.push({
          index: i,
          distance,
          givenText: username,
          comparedText: user.name,
        })
      }
    }

    if (candidates.length === 0) {
      return null
    }

    candidates = candidates.sort((u1, u2) => u1.distance - u2.distance)

    return candidates[0]
  }

  getGame(game: string): Guess | null {
    let candidates: Guess[] = []

    this.parsedResponse.options.map((option, i) => {
      const distance = jslevenshtein(
        game.toLowerCase(),
        option.text.toLowerCase()
      )
      if (distance <= MAX_DISTANCE_ALLOWED) {
        candidates.push({
          index: i,
          distance,
          givenText: game,
          comparedText: option.text,
        })
      }
    })

    if (candidates.length === 0) {
      return null
    }

    candidates = candidates.sort((u1, u2) => u1.distance - u2.distance)

    return candidates[0]
  }

  getGamesForUser(username: string): string {
    const user: Guess = this.getUser(username)

    if (user === null) {
      return `Aucun résultat pour "${username}"`
    }

    const playList: string[] = []
    const mayPlayList: string[] = []
    const doNotPlayList: string[] = []

    const participant = this.parsedResponse.participants[user.index]

    for (let i = 0; i < participant.preferences.length; i++) {
      const state = participant.preferences[i]
      const game = this.parsedResponse.options[i].text

      switch (state) {
        case 2:
          playList.push(game)
          break
        case 1:
          mayPlayList.push(game)
          break
        case 0:
          doNotPlayList.push(game)
          break
      }
    }

    if (playList.length > 0 && mayPlayList.length > 0) {
      return `**__${
        user.comparedText
      } joue aux jeux suivants :__** ${playList.join(
        ', '
      )}.\n**__Il est prêt à prendre les jeux suivants :__** ${mayPlayList.join(
        ', '
      )}.`
    }

    if (playList.length > 0 && mayPlayList.length === 0) {
      return `**__${
        user.comparedText
      } joue aux jeux suivants :__** ${playList.join(', ')}.`
    }

    return `Erreur lors de la récuperation des jeux de ${username}.`
  }

  getUsersForGame(gameToFind: string): string {
    const game = this.getGame(gameToFind)

    if (game === null) {
      return `Aucun résultat pour le jeu "${gameToFind}"`
    }

    const playerList: string[] = []
    const mayPlayList: string[] = []

    this.parsedResponse.participants.map(participant => {
      switch (participant.preferences[game.index]) {
        case 2:
          playerList.push(participant.name)
          break
        case 1:
          mayPlayList.push(participant.name)
          break
      }
    })

    if (playerList.length > 0 && mayPlayList.length > 0) {
      return `**__Les joueurs suivants (${playerList.length}) ont ${
        game.comparedText
      } :__** ${playerList.join(', ')}.
            \n**__Les joueurs suivants (${
              mayPlayList.length
            }) sont prêts à acheter le jeu :__** ${mayPlayList.join(', ')}.`
    }

    if (playerList.length > 0 && mayPlayList.length === 0) {
      return `**__Les joueurs suivants (${playerList.length}) ont ${
        game.comparedText
      } :__** ${playerList.join(', ')}.`
    }

    return `Erreur lors de la récupération de la liste des joueurs pour ${gameToFind}.`
  }
}
