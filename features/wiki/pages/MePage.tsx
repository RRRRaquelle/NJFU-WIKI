import InnerNav from "../components/layout/InnerNav";
import ResourceCard from "../components/ui/ResourceCard";
import Button from "../components/ui/Button";
import { mockUser, ResourceItem } from "../data/mock";

interface MePageProps {
  resourceItems: ResourceItem[];
  onNavigate: (page: string) => void;
  onSearch: (q: string) => void;
  onOpenDrawer: (item: ResourceItem) => void;
  onSave: (id: string) => void;
  onShowToast: (msg: string) => void;
  isLoggedIn?: boolean;
  username?: string;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function MePage({ resourceItems, onNavigate, onSearch, onOpenDrawer, onSave, onShowToast, isLoggedIn, username, onLogin, onLogout }: MePageProps) {
  const myContributions = resourceItems.filter((r) => mockUser.contributionIds.includes(r.id));
  const savedItems = resourceItems.filter((r) => r.isSaved);

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
      <InnerNav currentPage="me" onNavigate={onNavigate} onSearch={onSearch} isLoggedIn={isLoggedIn} username={username} onLogin={onLogin} onLogout={onLogout} />

      <main className="max-w-4xl mx-auto w-full px-[clamp(24px,4vw,64px)] py-10 flex flex-col gap-10">
        {/* User header */}
        <section className="flex items-start gap-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: mockUser.avatarColor }}
          >
            {mockUser.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-serif font-bold text-2xl text-[var(--color-ink)]">{mockUser.name}</h1>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onShowToast("个人信息编辑（原型演示）")}
              >
                编辑资料
              </Button>
            </div>
            <p className="text-sm text-[rgba(23,23,25,0.55)] font-body mt-1">
              {mockUser.dept} · {mockUser.grade}
            </p>
            <p className="text-base text-[rgba(23,23,25,0.75)] font-body mt-2 max-w-md">{mockUser.bio}</p>
          </div>
        </section>

        {/* Points */}
        <section className="bg-white border border-[var(--color-border)] rounded-[var(--radius-card)] p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-[rgba(23,23,25,0.5)] font-body mb-1">当前积分</p>
            <p className="font-display italic text-4xl font-bold text-[var(--color-crimson)]">{mockUser.points}</p>
            <p className="text-xs text-[rgba(23,23,25,0.45)] font-body mt-1">贡献资料和经验可获得积分</p>
          </div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" className="opacity-70">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </section>

        {/* AI Profile */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-xl text-[var(--color-ink)]">AI 用户画像</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onShowToast("AI 画像已重新生成（原型演示）")}
                className="text-sm font-body text-[rgba(23,23,25,0.5)] hover:text-[var(--color-crimson)] transition-colors flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                重新生成
              </button>
              <span className="text-[rgba(23,23,25,0.25)]">|</span>
              <button
                className="text-sm font-body text-[rgba(23,23,25,0.5)] hover:text-[var(--color-ink)] transition-colors"
                title="画像基于你的对话记录和主动填写信息生成，不包含真实个人隐私数据。"
              >
                隐私说明
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {mockUser.aiProfile.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full bg-[rgba(41,40,68,0.08)] text-[var(--color-indigo)] text-sm font-body font-medium border border-[rgba(41,40,68,0.12)]"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-xs text-[rgba(23,23,25,0.4)] font-body">
            画像根据你的对话和收藏行为生成，仅在本设备存储，不用于营销。
          </p>
        </section>

        {/* My contributions */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-xl text-[var(--color-ink)]">我的贡献</h2>
            <Button variant="text" size="sm" onClick={() => onNavigate("contribute")}>
              继续贡献 →
            </Button>
          </div>
          {myContributions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myContributions.map((item) => (
                <ResourceCard key={item.id} item={item} onOpen={onOpenDrawer} onSave={onSave} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[rgba(23,23,25,0.45)] font-body border border-dashed border-[var(--color-border)] rounded-2xl">
              还没有贡献，去分享你的第一份资料吧
            </div>
          )}
        </section>

        {/* My saved */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-xl text-[var(--color-ink)]">
              我的收藏
              <span className="ml-2 text-base font-normal text-[rgba(23,23,25,0.45)]">{savedItems.length} 条</span>
            </h2>
            <Button variant="text" size="sm" onClick={() => onNavigate("collections")}>
              查看全部 →
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedItems.slice(0, 3).map((item) => (
              <ResourceCard key={item.id} item={item} onOpen={onOpenDrawer} onSave={onSave} compact />
            ))}
          </div>
        </section>

        {/* Account footer */}
        <div className="flex gap-4 pt-4 border-t border-[var(--color-border)]">
          <Button variant="text" size="sm" onClick={() => onShowToast("账号设置（原型演示）")}>账号设置</Button>
          <Button variant="text" size="sm" onClick={() => onShowToast("已退出登录（原型演示）")}>退出登录</Button>
        </div>
      </main>
    </div>
  );
}
