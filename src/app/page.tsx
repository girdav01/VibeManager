import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold">VibeManager</h1>
          <div className="space-x-4">
            <Link href="/auth/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Plan SaaS Apps Like a Pro
            <br />
            Build with AI
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform ideas into implementation-ready PRDs. Connect your GitHub
            repo, generate AI-powered mindmaps, and export specs optimized for
            Cursor, Claude, and other AI coding tools.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8">
                Start Planning Free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20" id="features">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-2">AI Mindmapping</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Turn natural language ideas into structured feature breakdowns
                with AI-powered mindmaps
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-bold mb-2">Repo Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Auto-detect framework, routes, models, and build a visual
                knowledge base of your codebase
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold mb-2">Smart PRDs</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate implementation-ready specs with routes, models, and
                file paths for AI tools
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-bold mb-2">Drift Detection</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Keep specs and code aligned with automatic sync and change
                tracking
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">AI Tool Export</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Optimized exports for Cursor, Claude, and other AI coding
                assistants
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2">Task Management</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Lightweight Kanban boards to track feature implementation
                progress
              </p>
            </div>
          </div>

          <div className="mt-20 p-8 bg-blue-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">
              Perfect for Non-Technical Founders
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              No coding experience needed. VibeManager bridges the gap between
              your vision and AI-powered development.
            </p>
            <Link href="/auth/signup">
              <Button size="lg">Get Started Now →</Button>
            </Link>
          </div>
        </main>

        <footer className="mt-20 pt-8 border-t text-center text-gray-600 dark:text-gray-400">
          <p>© 2024 VibeManager. Built for the AI coding era.</p>
        </footer>
      </div>
    </div>
  );
}
