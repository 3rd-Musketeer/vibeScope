import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, User, MapPin, Tag, Heart, MessageCircle, Bookmark } from 'lucide-react'
import { RedNoteDBSchema } from '@/lib/types'
import ReactMarkdown from 'react-markdown'

interface TaskModalProps {
  task: RedNoteDBSchema
  children: React.ReactNode
}

export function TaskModal({ task, children }: TaskModalProps) {
  const { note_content, user_profile, image_base64 } = task

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{note_content.title}</span>
            {task.url && (
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 用户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>作者信息</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4">
                {note_content.author_avatar_url && (
                  <img
                    src={note_content.author_avatar_url}
                    alt="作者头像"
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div className="space-y-2">
                  <div className="font-medium">{user_profile.author_name}</div>
                  {user_profile.introduction && (
                    <div className="text-sm text-muted-foreground">
                      {user_profile.introduction}
                    </div>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    {user_profile.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{user_profile.location}</span>
                      </div>
                    )}
                    {user_profile.career && (
                      <div>{user_profile.career}</div>
                    )}
                  </div>
                  {user_profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {user_profile.interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 帖子内容 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">帖子内容</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{note_content.like_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{note_content.comment_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Bookmark className="w-3 h-3" />
                  <span>{note_content.favorite_count}</span>
                </div>
                <div>{note_content.date}</div>
                {note_content.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{note_content.location}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 标签 */}
              {note_content.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note_content.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 正文内容 */}
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{note_content.content}</ReactMarkdown>
              </div>

              {/* 图片 */}
              {image_base64.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {image_base64.map((imageData, index) => (
                    <img
                      key={index}
                      src={imageData}
                      alt={`图片 ${index + 1}`}
                      className="rounded-lg max-w-full h-auto"
                    />
                  ))}
                </div>
              )}

              {/* 评论 */}
              {note_content.comments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">评论</h4>
                  {note_content.comments.map((comment, index) => (
                    <div key={index} className="bg-muted p-3 rounded-lg text-sm">
                      <div>{comment.comment}</div>
                      {comment.reply_to_comment && (
                        <div className="mt-1 text-muted-foreground">
                          回复: {comment.reply_to_comment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 任务信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">处理信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Token 消耗:</span>
                  <span className="ml-2">{task.token_usage}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">处理时间:</span>
                  <span className="ml-2">{task.processing_time_seconds}秒</span>
                </div>
                <div>
                  <span className="text-muted-foreground">创建时间:</span>
                  <span className="ml-2">{new Date(task.created_at).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}