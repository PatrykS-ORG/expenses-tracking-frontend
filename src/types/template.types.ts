export const MAX_USER_TEMPLATES = 5

export interface Template {
  id: string
  user_id?: string
  name: string
  content: string
  created_at: string
}
