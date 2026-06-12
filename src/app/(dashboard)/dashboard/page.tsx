import { FolderOpen, Sprout, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/core/supabase/server";
import { getProjectCount } from "@/features/projects";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const projectCount = user ? await getProjectCount(user.id) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email?.split("@")[0]}.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-green-600" />
              Crop Advisory
            </CardTitle>
            <CardDescription>
              Ask Munda anything about your crops — disease diagnosis, pest control, soil health,
              harvest timing, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Powered by Claude AI. Get actionable, region-specific advice in seconds.
            </p>
            <Button asChild>
              <a href="/dashboard/advisory">Open Crop Advisory &rarr;</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
            <CardDescription>Your account</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="text-sm font-medium truncate">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last Sign In</dt>
                <dd className="text-sm">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString()
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Projects
            </CardTitle>
            <CardDescription>Your saved sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {projectCount > 0
                ? `${projectCount} project${projectCount === 1 ? "" : "s"} saved.`
                : "No projects yet."}
            </p>
            <a href="/dashboard/projects" className="text-sm text-primary hover:underline">
              Manage projects &rarr;
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
