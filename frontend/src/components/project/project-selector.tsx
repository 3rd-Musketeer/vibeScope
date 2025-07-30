'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useMemo } from 'react'
import { useProjects, useCreateProject } from '@/hooks/use-projects'
import { useStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Check, Plus } from 'lucide-react'

export function ProjectSelector() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  const { data: projects = [], isLoading } = useProjects()
  const { mutate: createProject, isPending: isCreating } = useCreateProject()
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
          setCurrentProject(newProject.id)
          setSearchQuery('')
          setShowDropdown(false)
        }
      })
    }
  }
  
  const handleSelectProject = (projectId: string) => {
    setCurrentProject(projectId)
    setSearchQuery('')
    setShowDropdown(false)
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
                    className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <span>{project.name}</span>
                    {project.id === currentProjectId && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
                
                {searchQuery && !exactMatch && (
                  <div
                    className="flex items-center p-3 hover:bg-muted cursor-pointer text-muted-foreground"
                    onClick={handleCreateProject}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建项目 "{searchQuery}"
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