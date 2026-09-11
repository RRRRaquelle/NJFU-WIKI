import { useState } from "react";
import InnerNav from "../components/layout/InnerNav";
import ResourceCard from "../components/ui/ResourceCard";
import { ResourceItem, Folder } from "../data/mock";
import Button from "../components/ui/Button";

interface CollectionsPageProps {
  resourceItems: ResourceItem[];
  folders: Folder[];
  onNavigate: (page: string) => void;
  onSearch: (q: string) => void;
  onOpenDrawer: (item: ResourceItem) => void;
  onSave: (id: string) => void;
  onAddFolder: (name: string) => void;
  isLoggedIn?: boolean;
  username?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function CollectionsPage({
  resourceItems, folders, onNavigate, onSearch, onOpenDrawer, onSave, onAddFolder,
  isLoggedIn, username, onLogin, onLogout,
}: CollectionsPageProps) {
  const savedItems = resourceItems.filter((r) => r.isSaved);
  const [activeFolderId, setActiveFolderId] = useState("f-all");
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const displayItems = activeFolderId === "f-all"
    ? savedItems
    : savedItems.filter((r) => activeFolder?.itemIds.includes(r.id));

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    onAddFolder(newFolderName.trim());
    setNewFolderName("");
    setNewFolderMode(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
      <InnerNav
        currentPage="collections"
        onNavigate={onNavigate}
        onSearch={onSearch}
        isLoggedIn={isLoggedIn}
        username={username}
        onLogin={onLogin}
        onLogout={onLogout}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-[clamp(24px,4vw,64px)] py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-serif font-bold text-3xl text-[var(--color-ink)]">我的收藏</h1>
          <p className="text-sm text-[rgba(23,23,25,0.5)] font-body mt-1">
            共 {savedItems.length} 条收藏内容
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar folders */}
          <aside className="w-52 flex-shrink-0 flex flex-col gap-1">
            {folders.map((folder) => {
              const count = folder.id === "f-all"
                ? savedItems.length
                : savedItems.filter((r) => folder.itemIds.includes(r.id)).length;
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-body transition-all text-left ${
                    activeFolderId === folder.id
                      ? "bg-[var(--color-ink)] text-[var(--color-paper)]"
                      : "text-[var(--color-ink)] hover:bg-[rgba(23,23,25,0.06)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    {folder.name}
                  </span>
                  <span className="text-xs opacity-60">{count}</span>
                </button>
              );
            })}

            {/* New folder */}
            {newFolderMode ? (
              <div className="px-2 pt-1">
                <input
                  autoFocus
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="文件夹名称"
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg font-body focus:outline-none focus:border-[var(--color-ink)]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFolder();
                    if (e.key === "Escape") setNewFolderMode(false);
                  }}
                />
                <div className="flex gap-2 mt-2">
                  <Button variant="primary" size="sm" onClick={handleAddFolder} className="flex-1 justify-center">
                    创建
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setNewFolderMode(false)} className="flex-1 justify-center">
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setNewFolderMode(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-body text-[rgba(23,23,25,0.5)] hover:text-[var(--color-ink)] hover:bg-[rgba(23,23,25,0.04)] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                新建文件夹
              </button>
            )}
          </aside>

          {/* Content */}
          <div className="flex-1">
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[rgba(23,23,25,0.2)]">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-lg font-serif font-bold text-[var(--color-ink)]">
                  {activeFolderId === "f-all" ? "还没有收藏内容" : "这个文件夹还是空的"}
                </p>
                <p className="text-sm text-[rgba(23,23,25,0.5)] font-body">
                  去发现页看看吧
                </p>
                <Button variant="primary" onClick={() => onNavigate("discover")}>
                  去发现
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {displayItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <ResourceCard
                      item={item}
                      onOpen={onOpenDrawer}
                      onSave={onSave}
                    />
                    {/* Context menu placeholder on hover */}
                    <button
                      className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[rgba(23,23,25,0.08)] transition-all"
                      onClick={(e) => e.stopPropagation()}
                      title="更多操作"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
