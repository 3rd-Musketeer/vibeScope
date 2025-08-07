// Mirror backend schemas as TypeScript interfaces

export interface TaskSchema {
  id: string
  project_id: string
  url: string
  html?: string | null
  status: 'pending' | 'processing' | 'failed'
  created_at: string
  updated_at: string
  error_msg?: string | null
}

export interface ProjectSchema {
  id: string
  name: string
  auth_token: string
  created_at: string
}

export interface TaskCreateRequest {
  project_id: string
  url?: string | null
  html?: string | null
}

export interface ProjectCreateRequest {
  name: string
}


// RAG Query Types
export interface QueryRequest {
  project_id: string
  question: string
}

export interface QueryResponse {
  answer: string
  relevant_note_ids: string[]
}

export interface TaskResponse {
  id: string
  project_id: string
  url: string
  html?: string | null
  status: 'pending' | 'processing' | 'failed'
  created_at: string
  updated_at: string
  error_msg?: string | null
}

export interface ProjectStatsResponse {
  total_tasks: number
  pending_tasks: number
  processing_tasks: number
  failed_tasks: number
  successful_tasks: number
  token_usage: number
  processing_time_seconds: number
}

// New component-based schemas matching backend API
export interface BaseContentModel {
  title: string
  content: string
  author_name: string
  publish_date: string
}

export interface LinksModel {
  author_avatar_url: string
  author_profile_url: string
  image_urls: string[]
}

export interface MetadataModel {
  tags: string[]
  like_count: number
  comment_count: number
  favorite_count: number
  location: string
}

export interface CommentsModel {
  comment_content: string
  comment_author_name: string
  comment_publish_date: string
  first_reply_to_comment: string
}

export interface AuthorProfileModel {
  author_name: string
  location: string
  author_avatar_url: string
  introduction: string
  related_topics: string[]
  interests: string[]
  careers: string[]
}

// New ExtractedContentResponse matching backend API
export interface ExtractedContentResponse {
  id: string
  project_id: string
  url?: string | null
  html?: string | null
  base_content: BaseContentModel
  links: LinksModel
  metadata: MetadataModel
  comments: CommentsModel[]
  author_profile: AuthorProfileModel
  image_assets: string[]
  avatar_asset: string
  token_usage: number
  created_at: string
  processing_time_seconds: number
}

// Legacy schemas for backward compatibility (deprecated)
export interface CommentSchema {
  comment: string
  reply_to_comment: string
}

export interface ContentSchema {
  title: string
  content: string
  tags: string[]
  date: string
  like_count: number
  comment_count: number
  favorite_count: number
  location: string
  image_urls: string[]
  video_urls: string[]
  author_name: string
  author_avatar_url: string
  author_profile_url: string
  comments: CommentSchema[]
}

export interface UserProfileSchema {
  location: string
  author_name: string
  author_avatar_url: string
  introduction: string
  related_topics: string[]
  interests: string[]
  career: string
}

export interface ContentDBSchema {
  id: string
  url?: string | null
  html?: string | null
  note_content: ContentSchema
  user_profile: UserProfileSchema
  image_assets: string[]
  token_usage: number
  created_at: string
  processing_time_seconds: number
}

// Export response type  
export interface ProjectExportResponse {
  project: ProjectSchema
  successful_tasks: ExtractedContentResponse[]
  export_timestamp: string
  total_tasks: number
}

// Legacy export response for backward compatibility
export interface LegacyProjectExportResponse {
  project: ProjectSchema
  successful_tasks: ContentDBSchema[]
  export_timestamp: string
  total_tasks: number
}

// Client-side types (moved to store.ts)


