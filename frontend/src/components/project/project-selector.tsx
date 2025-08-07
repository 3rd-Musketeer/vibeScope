'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useMemo } from 'react'
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/use-projects'
import { useStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Check, Plus, Trash2, AlertTriangle } from 'lucide-react'

export function ProjectSelector() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  const { data: projects = [], isLoading } = useProjects()
  const { mutate: createProject, isPending: isCreating } = useCreateProject()
  const { mutate: deleteProject, isPending: isDeleting } = useDeleteProject()
  const { currentProjectId, setCurrentProject } = useStore()
  
  const currentProject = projects.find(p => p.id === currentProjectId)
  
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [projects, searchQuery])
  
  const exactMatch = filteredProjects.find(p => 
    p.name.toLowerCase() === searchQuery.toLowerCase()
  )
  
  const handleCreateProject = () => {
    if (searchQuery.trim()) {
      createProject(searchQuery.trim(), {
        onSuccess: (newProject) => {
          setCurrentProject(newProject.id, newProject.auth_token)
          setSearchQuery('')
          setShowDropdown(false)
        }
      })
    }
  }
  
  const handleSelectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(projectId, project.auth_token)
      setSearchQuery('')
      setShowDropdown(false)
    }
  }

  const handleDeleteProject = (projectId: string, projectToken: string) => {
    deleteProject({ projectId, token: projectToken })
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Input
            placeholder="搜索或创建项目..."
            value={showDropdown ? searchQuery : currentProject?.name || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-64"
            disabled={isLoading}
          />
          
          {showDropdown && (
            <Card className="absolute top-full mt-1 w-full z-50 max-h-60 overflow-y-auto">
              <CardContent className="p-0">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 hover:bg-muted border-b last:border-b-0 group"
                  >
                    <div
                      className="flex items-center flex-1 cursor-pointer"
                      onClick={() => handleSelectProject(project.id)}
                    >
                      <span>{project.name}</span>
                      {project.id === currentProjectId && (
                        <Check className="w-4 h-4 text-green-600 ml-2" />
                      )}
                    </div>
                    
                    {/* Delete Button with Confirmation */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-red-500 hover:text-red-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            删除项目
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>确定要删除项目 <strong>&ldquo;{project.name}&rdquo;</strong> 吗？</p>
                          <p className="text-sm text-muted-foreground">
                            此操作将永久删除项目及其所有数据，无法恢复。
                          </p>
                          <div className="flex justify-end space-x-3">
                            <DialogTrigger asChild>
                              <Button variant="outline">取消</Button>
                            </DialogTrigger>
                            <DialogTrigger asChild>
                              <Button 
                                variant="destructive"
                                onClick={() => handleDeleteProject(project.id, project.auth_token)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? '删除中...' : '确认删除'}
                              </Button>
                            </DialogTrigger>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
                
                {searchQuery && !exactMatch && (
                  <div
                    className="flex items-center p-3 hover:bg-muted cursor-pointer text-muted-foreground"
                    onClick={handleCreateProject}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建项目 &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
                
                {filteredProjects.length === 0 && !searchQuery && (
                  <div className="p-3 text-muted-foreground text-center">
                    暂无项目
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {searchQuery && !showDropdown && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={exactMatch ? () => handleSelectProject(exactMatch.id) : handleCreateProject}
            disabled={isCreating}
          >
            {isCreating ? '创建中...' : exactMatch ? '打开项目' : '创建项目'}
          </Button>
        )}
      </div>
    </div>
  )
}