export interface DoodleResponse {
  id: string

  initiated: number
  lastChange: number

  participantsCount: number

  title: string
  description: string

  options: Option[]
  participants: Participant[]
}

export interface Option {
  text: string
}

export interface Participant {
  id: number
  name: string
  preferences: number[]
}
