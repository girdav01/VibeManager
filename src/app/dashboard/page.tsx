"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { data: projects, isLoading } = trpc.project.list.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <Link href="/projects/new">
            <Button>+ New Project</Button>
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>
                Get started by creating your first project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/projects/new">
                <Button size="lg">Create Your First Project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Repos:</span>
                        <span className="font-medium">{project.repos.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Features:</span>
                        <span className="font-medium">{project.features.length}</span>
                      </div>
                      {project.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.features.slice(0, 3).map((feature) => (
                            <Badge key={feature.id} variant="secondary">
                              {feature.status}
                            </Badge>
                          ))}
                          {project.features.length > 3 && (
                            <Badge variant="outline">
                              +{project.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Updated {formatDate(project.updatedAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
