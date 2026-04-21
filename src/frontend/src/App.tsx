import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { UserProvider } from "@/context/UserContext";
import { ArticleBrowserPage } from "@/pages/ArticleBrowserPage";
import { ArticleDetailPage } from "@/pages/ArticleDetailPage";
import { MetricsDashboardPage } from "@/pages/MetricsDashboardPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SearchPage } from "@/pages/SearchPage";
import { UploadPage } from "@/pages/UploadPage";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ArticleBrowserPage,
});

const articleDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/articles/$id",
  component: ArticleDetailPage,
});

const metricsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/metrics",
  component: MetricsDashboardPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) ?? "",
    category: (search.category as string) ?? "",
  }),
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upload",
  component: UploadPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  articleDetailRoute,
  metricsRoute,
  searchRoute,
  uploadRoute,
  profileRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </UserProvider>
    </AuthProvider>
  );
}
