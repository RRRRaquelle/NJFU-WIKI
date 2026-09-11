'use client';

import { useState, useCallback, useEffect } from "react";
import { folders as initialFolders, Folder, ResourceItem } from "./data/mock";
import { AuthProvider, useAuth } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import CollectionsPage from "./pages/CollectionsPage";
import ContributePage from "./pages/ContributePage";
import MePage from "./pages/MePage";
import LoginModal from "./components/overlays/LoginModal";
import ResourceDrawer from "./components/overlays/ResourceDrawer";
import { useToast, ToastContainer } from "./components/ui/Toast";

type PageKey = "home" | "discover" | "collections" | "contribute" | "me";
type DiscoverState = "default" | "search" | "ai";
type ContributeState = "form" | "preview" | "success";

interface Route {
  page: PageKey;
  discoverState?: DiscoverState;
  discoverQuery?: string;
  contributeState?: ContributeState;
}

function AppInner() {
  const { isLoggedIn, username, login, logout } = useAuth();
  const [route, setRoute] = useState<Route>({ page: "home" });
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [drawerItem, setDrawerItem] = useState<ResourceItem | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const { showToast, toasts, dismiss } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/resources", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`资料目录加载失败（${response.status}）`);
        return response.json() as Promise<{ resources?: ResourceItem[] }>;
      })
      .then((payload) => setResources(payload.resources ?? []))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("Resource catalog unavailable", error);
        showToast("资料目录暂时无法加载，AI 问答仍可使用");
      });
    return () => controller.abort();
  }, [showToast]);

  const navigate = useCallback((page: string, state?: string, query?: string) => {
    const p = page as PageKey;

    if ((p === "collections" || p === "me") && !isLoggedIn) {
      const captured = { page, state, query };
      setPendingAction(() => () => navigate(captured.page, captured.state, captured.query));
      setLoginOpen(true);
      return;
    }

    if (p === "discover") {
      setRoute({
        page: "discover",
        discoverState: (state as DiscoverState) || "default",
        discoverQuery: query || "",
      });
    } else if (p === "contribute") {
      setRoute({ page: "contribute", contributeState: (state as ContributeState) || "form" });
    } else {
      setRoute({ page: p });
    }
  }, [isLoggedIn]);

  const handleSearch = useCallback((q: string) => {
    setRoute({ page: "discover", discoverState: "search", discoverQuery: q });
  }, []);

  const handleSave = useCallback((id: string) => {
    if (!isLoggedIn) {
      setPendingAction(() => () => handleSave(id));
      setLoginOpen(true);
      return;
    }
    setResources((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const saving = !r.isSaved;
        showToast(saving ? "已收藏" : "已取消收藏");
        return { ...r, isSaved: saving };
      })
    );
  }, [isLoggedIn, showToast]);

  const handleOpenDrawer = useCallback((item: ResourceItem) => {
    setDrawerItem(resources.find((r) => r.id === item.id) || item);
  }, [resources]);

  const handleLoginSuccess = (uname: string) => {
    login(uname);
    setLoginOpen(false);
    showToast(`登录成功，欢迎回来，${uname}`);
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      action();
    }
  };

  const handleLogout = useCallback(() => {
    logout();
    showToast("已退出登录");
    setRoute({ page: "home" });
  }, [logout, showToast]);

  const handleLoginClose = () => {
    setLoginOpen(false);
    setPendingAction(null);
  };

  const handleAddFolder = (name: string) => {
    const newFolder: Folder = {
      id: `f-custom-${Date.now()}`,
      name,
      itemIds: [],
    };
    setFolders((prev) => [...prev, newFolder]);
    showToast(`文件夹「${name}」已创建`);
  };

  const handleContributeStateChange = (s: ContributeState) => {
    setRoute({ page: "contribute", contributeState: s });
  };

  const handleLoginRequired = (action: () => void) => {
    setPendingAction(() => action);
    setLoginOpen(true);
  };

  const syncedDrawerItem = drawerItem
    ? (resources.find((r) => r.id === drawerItem.id) || drawerItem)
    : null;

  return (
    <div className="min-h-full">
      {route.page === "home" && (
        <HomePage
          onNavigate={navigate}
          onLogin={() => setLoginOpen(true)}
          onLogout={handleLogout}
          isLoggedIn={isLoggedIn}
          username={username}
        />
      )}

      {route.page === "discover" && (
        <DiscoverPage
          state={route.discoverState || "default"}
          query={route.discoverQuery}
          resourceItems={resources}
          onNavigate={navigate}
          onSearch={handleSearch}
          onOpenDrawer={handleOpenDrawer}
          onSave={handleSave}
          onLoginRequired={handleLoginRequired}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogin={() => setLoginOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {route.page === "collections" && (
        <CollectionsPage
          resourceItems={resources}
          folders={folders}
          onNavigate={navigate}
          onSearch={handleSearch}
          onOpenDrawer={handleOpenDrawer}
          onSave={handleSave}
          onAddFolder={handleAddFolder}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogin={() => setLoginOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {route.page === "contribute" && (
        <ContributePage
          state={route.contributeState || "form"}
          onNavigate={navigate}
          onSearch={handleSearch}
          onStateChange={handleContributeStateChange}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogin={() => setLoginOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {route.page === "me" && (
        <MePage
          resourceItems={resources}
          onNavigate={navigate}
          onSearch={handleSearch}
          onOpenDrawer={handleOpenDrawer}
          onSave={handleSave}
          onShowToast={showToast}
          isLoggedIn={isLoggedIn}
          username={username}
          onLogin={() => setLoginOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {loginOpen && (
        <LoginModal
          onSuccess={handleLoginSuccess}
          onClose={handleLoginClose}
        />
      )}

      {syncedDrawerItem && (
        <ResourceDrawer
          item={syncedDrawerItem}
          onClose={() => setDrawerItem(null)}
          onSave={handleSave}
        />
      )}

      {ToastContainer && <ToastContainer toasts={toasts ?? []} dismiss={dismiss} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
